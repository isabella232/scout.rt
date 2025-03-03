/*
 * Copyright (c) 2010-2020 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 */
package org.eclipse.scout.rt.platform.security;

import static org.eclipse.scout.rt.platform.util.Assertions.*;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.security.GeneralSecurityException;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.Key;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.Signature;
import java.security.SignatureException;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.KeySpec;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Collections;

import javax.crypto.Cipher;
import javax.crypto.CipherOutputStream;
import javax.crypto.Mac;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;

import org.eclipse.scout.rt.platform.Order;
import org.eclipse.scout.rt.platform.exception.ProcessingException;
import org.eclipse.scout.rt.platform.util.Base64Utility;
import org.eclipse.scout.rt.platform.util.Assertions.*;

/**
 * Utility class for encryption/decryption, hashing, random number generation and digital signatures.<br>
 * <br>
 * <b>Note:</b> this class requires the following providers to be available and authenticated in the running JRE: SUN,
 * SunJCE, SunEC. See
 * <a href="http://docs.oracle.com/javase/8/docs/technotes/guides/security/SunProviders.html#SunJCEProvider">Java
 * Cryptography Architecture Oracle Providers Documentation for JDK 8</a>.
 *
 * @since 6.1
 */
@Order(5500)
public class SunSecurityProvider implements ISecurityProvider {
  /**
   * Specifies the minimum of password hash iterations.
   */
  protected static final int MIN_PASSWORD_HASH_ITERATIONS = 10000;

  /**
   * Buffer size for {@link InputStream} read.
   */
  protected static final int BUF_SIZE = 8192;

  /**
   * Length (in bytes) of Initialization Vector for Galois/Counter Mode (as defined in
   * <a href="http://csrc.nist.gov/publications/nistpubs/800-38D/SP-800-38D.pdf">NIST Special Publication SP 800-38D</a>
   * ).
   */
  protected static final int GCM_INITIALIZATION_VECTOR_LEN = 16;

  /**
   * Length (in bits) of authentication tag T of Initialization Vector for Galois/Counter Mode (as defined in
   * <a href="http://csrc.nist.gov/publications/nistpubs/800-38D/SP-800-38D.pdf">NIST Special Publication SP 800-38D</a>
   * ).
   */
  protected static final int GCM_AUTH_TAG_BIT_LEN = 128;

  @Override
  public EncryptionKey createEncryptionKey(char[] password, byte[] salt, int keyLen) {
    assertGreater(assertNotNull(password, "password must not be null.").length, 0, "empty password is not allowed.");
    assertGreater(assertNotNull(salt, "salt must be provided.").length, 0, "empty salt is not allowed.");
    assertTrue(keyLen == 128 || keyLen == 192 || keyLen == 256, "key length must be 128, 192 or 256.");

    try {
      SecretKeyFactory factory = SecretKeyFactory.getInstance(getSecretKeyAlgorithm(), getCipherAlgorithmProvider());
      KeySpec spec = new PBEKeySpec(password, salt, getKeyDerivationIterationCount(), keyLen + (GCM_INITIALIZATION_VECTOR_LEN * 8));
      SecretKey tmpSecret = factory.generateSecret(spec);

      // derive Key and Initialization Vector
      byte[] encoded = tmpSecret.getEncoded();
      byte[] iv = new byte[GCM_INITIALIZATION_VECTOR_LEN];
      byte[] key = new byte[keyLen / 8];
      System.arraycopy(encoded, 0, key, 0, key.length);
      System.arraycopy(encoded, key.length, iv, 0, GCM_INITIALIZATION_VECTOR_LEN);

      SecretKey secretKey = new SecretKeySpec(key, getCipherAlgorithm());
      GCMParameterSpec parameters = new GCMParameterSpec(GCM_AUTH_TAG_BIT_LEN, iv);
      return new EncryptionKey(secretKey, parameters);
    }
    catch (NoSuchAlgorithmException e) {
      throw new ProcessingException("Unable to create secret. Algorithm could not be found. Make sure to use JRE 1.8 or newer.", e);
    }
    catch (InvalidKeySpecException | NoSuchProviderException e) {
      throw new ProcessingException("Unable to create secret.", e);
    }
  }

  @Override
  public void encrypt(InputStream clearTextData, OutputStream encryptedData, EncryptionKey key) {
    doCrypt(clearTextData, encryptedData, key, Cipher.ENCRYPT_MODE);
  }

  @Override
  public void decrypt(InputStream encryptedData, OutputStream clearTextData, EncryptionKey key) {
    doCrypt(encryptedData, clearTextData, key, Cipher.DECRYPT_MODE);
  }

  protected void doCrypt(InputStream input, OutputStream output, EncryptionKey key, int mode) {
    assertNotNull(key, "key must not be null.");
    if (input == null) {
      throw new AssertionException("input must not be null.");
    }
    if (output == null) {
      throw new AssertionException("output must not be null.");
    }

    try {
      Cipher cipher = Cipher.getInstance(getCipherAlgorithm() + "/" + getCipherAlgorithmMode() + "/" + getCipherAlgorithmPadding(), getCipherAlgorithmProvider());
      cipher.init(mode, key.get(), key.params());

      try (OutputStream out = new CipherOutputStream(output, cipher)) {
        int n;
        byte[] buf = new byte[BUF_SIZE];
        while ((n = input.read(buf)) >= 0) {
          out.write(buf, 0, n);
        }
      }
    }
    catch (NoSuchAlgorithmException e) {
      throw new ProcessingException("Unable to crypt data. Algorithm could not be found. Make sure to use JRE 1.8 or newer.", e);
    }
    catch (NoSuchPaddingException | InvalidKeyException | InvalidAlgorithmParameterException | NoSuchProviderException | IOException e) {
      throw new ProcessingException("Unable to crypt data.", e);
    }
  }

  @Override
  public SecureRandom createSecureRandom() {
    return new SecureRandom();
  }

  @Override
  public byte[] createSecureRandomBytes(int numBytes) {
    assertGreater(numBytes, 0, "{} is not a valid number for random bytes.", numBytes);
    byte[] rnd = new byte[numBytes];
    createSecureRandom().nextBytes(rnd);
    return rnd;
  }

  /**
   * If this method throws a NoSuchAlgorithmException, this may be because you are using an older Java version. In this
   * case it is safe to replace the algorithm with "PBKDF2WithHmacSHA1". SHA1 is still safe in the context of PBKDF2. To
   * do so replace this bean with your own implementation overwriting the method
   * {@link #getPasswordHashSecretKeyAlgorithm()}.
   */
  @Override
  public byte[] createPasswordHash(char[] password, byte[] salt, int iterations) {
    assertGreater(assertNotNull(password, "password must not be null.").length, 0, "empty password is not allowed.");
    assertGreater(assertNotNull(salt, "salt must not be null.").length, 0, "empty salt is not allowed.");
    assertGreaterOrEqual(iterations, MIN_PASSWORD_HASH_ITERATIONS, "iterations must be > {}", MIN_PASSWORD_HASH_ITERATIONS);
    // other checks are done by the PBEKeySpec constructor

    try {
      SecretKeyFactory skf = SecretKeyFactory.getInstance(getPasswordHashSecretKeyAlgorithm(), getCipherAlgorithmProvider());
      PBEKeySpec spec = new PBEKeySpec(password, salt, iterations, 256);
      SecretKey key = skf.generateSecret(spec);
      byte[] res = key.getEncoded();
      return res;
    }
    catch (NoSuchAlgorithmException | InvalidKeySpecException | NoSuchProviderException e) {
      throw new ProcessingException("Unable to create password hash.", e);
    }
  }

  @Override
  public byte[] createHash(InputStream data, byte[] salt, int iterations) {
    if (data == null) {
      throw new AssertionException("no data provided");
    }
    try {
      MessageDigest digest = MessageDigest.getInstance(getDigestAlgorithm(), getDigestAlgorithmProvider());
      digest.reset();
      if (salt != null && salt.length > 0) {
        digest.update(salt);
      }

      int n;
      byte[] buf = new byte[BUF_SIZE];
      while ((n = data.read(buf)) >= 0) {
        digest.update(buf, 0, n);
      }

      byte[] key = digest.digest();
      for (int i = 1; i < iterations; i++) {
        key = digest.digest(key);
        digest.reset();
      }
      return key;
    }
    catch (NoSuchAlgorithmException | NoSuchProviderException | IOException e) {
      throw new ProcessingException("Unable to hash.", e);
    }
  }

  @Override
  public KeyPairBytes createKeyPair() {
    try {
      KeyPairGenerator keyGen = KeyPairGenerator.getInstance(getKeyPairGenerationAlgorithm(), getSignatureProvider());
      ECGenParameterSpec spec = new ECGenParameterSpec(getEllipticCurveName());
      keyGen.initialize(spec, createSecureRandom());
      KeyPair keyPair = keyGen.generateKeyPair();

      X509EncodedKeySpec x509EncodedKeySpec = new X509EncodedKeySpec(keyPair.getPublic().getEncoded());
      PKCS8EncodedKeySpec pkcs8EncodedKeySpec = new PKCS8EncodedKeySpec(keyPair.getPrivate().getEncoded());

      return new KeyPairBytes(pkcs8EncodedKeySpec.getEncoded(), x509EncodedKeySpec.getEncoded());
    }
    catch (NoSuchProviderException | InvalidAlgorithmParameterException | NoSuchAlgorithmException e) {
      throw new ProcessingException("unable to create a new key-pair", e);
    }
  }

  @Override
  public byte[] createSignature(byte[] privateKey, InputStream data) {
    assertGreater(assertNotNull(privateKey, "no private key provided").length, 0, "empty private key not allowed");
    if (data == null) {
      throw new AssertionException("no data provided");
    }

    try {
      // create private key from bytes
      KeyFactory keyFactory = KeyFactory.getInstance(getKeyPairGenerationAlgorithm(), getSignatureProvider());
      PKCS8EncodedKeySpec privateKeySpec = new PKCS8EncodedKeySpec(privateKey);
      PrivateKey priv = keyFactory.generatePrivate(privateKeySpec);

      // create signature
      Signature sig = Signature.getInstance(getSignatureAlgorithm(), getSignatureProvider());
      sig.initSign(priv, createSecureRandom());

      int n;
      byte[] buf = new byte[BUF_SIZE];
      while ((n = data.read(buf)) >= 0) {
        sig.update(buf, 0, n);
      }

      return sig.sign();
    }
    catch (NoSuchProviderException | NoSuchAlgorithmException | InvalidKeySpecException | InvalidKeyException | SignatureException | IOException e) {
      throw new ProcessingException("unable to create signature.", e);
    }
  }

  @Override
  public boolean verifySignature(byte[] publicKey, InputStream data, byte[] signatureToVerify) {
    assertGreater(assertNotNull(publicKey, "no public key provided").length, 0, "empty public key not allowed");
    assertGreater(assertNotNull(signatureToVerify, "no signature provided").length, 0, "empty signature not allowed");
    if (data == null) {
      throw new AssertionException("no data provided");
    }

    try {
      // create public key from bytes
      KeyFactory keyFactory = KeyFactory.getInstance(getKeyPairGenerationAlgorithm(), getSignatureProvider());
      X509EncodedKeySpec pubKeySpec = new X509EncodedKeySpec(publicKey);
      PublicKey pubKey = keyFactory.generatePublic(pubKeySpec);

      // verify signature
      Signature sig = Signature.getInstance(getSignatureAlgorithm(), getSignatureProvider());
      sig.initVerify(pubKey);

      int n;
      byte[] buf = new byte[BUF_SIZE];
      while ((n = data.read(buf)) >= 0) {
        sig.update(buf, 0, n);
      }

      return sig.verify(signatureToVerify);
    }
    catch (NoSuchAlgorithmException | NoSuchProviderException | InvalidKeySpecException | InvalidKeyException | SignatureException | IOException t) {
      throw new ProcessingException("unable to verify signature", t);
    }
  }

  @Override
  public byte[] createMac(byte[] password, InputStream data) {
    assertGreater(assertNotNull(password, "no password provided").length, 0, "empty password not allowed");
    if (data == null) {
      throw new AssertionException("no data provided");
    }

    try {
      String algorithm = getMacAlgorithm();
      SecretKeySpec key = new SecretKeySpec(password, 0, password.length, algorithm);
      Mac mac = Mac.getInstance(algorithm, getMacAlgorithmProvider());
      mac.init(key);

      int n;
      byte[] buf = new byte[BUF_SIZE];
      while ((n = data.read(buf)) >= 0) {
        mac.update(buf, 0, n);
      }

      return mac.doFinal();
    }
    catch (NoSuchAlgorithmException | InvalidKeyException | IllegalStateException | IOException | NoSuchProviderException e) {
      throw new ProcessingException("unable to create signature.", e);
    }
  }

  /**
   * @return The MAC algorithm to use.
   */
  protected String getMacAlgorithm() {
    // The HmacSHA256 algorithm (as defined in <a href="http://www.ietf.org/rfc/rfc2104.txt">RFC 2104</a>) with SHA-256 as the message digest algorithm.
    return "HmacSHA256";
  }

  /**
   * @return The provider of the MAC algorithm.
   * @see #getMacAlgorithm()
   */
  protected String getMacAlgorithmProvider() {
    // Sun Java Cryptography Extension Provider
    return "SunJCE";
  }

  /**
   * @return Iteration count for key derivation.
   */
  protected int getKeyDerivationIterationCount() {
    return 3557;
  }

  /**
   * @return The algorithm for digital signatures.
   */
  protected String getSignatureAlgorithm() {
    // The Elliptic Curve Digital Signature Algorithm as defined in ANSI X9.62.
    return "SHA512withECDSA";
  }

  /**
   * @return The provider of the signature algorithm
   * @see #getSignatureAlgorithm()
   */
  protected String getSignatureProvider() {
    // Provider for the Elliptic Curve algorithm
    return "SunEC";
  }

  /**
   * @return The algorithm for public- and private-key-pair generation.
   */
  protected String getKeyPairGenerationAlgorithm() {
    // Generates key-pairs for the Elliptic Curve algorithm.
    return "EC";
  }

  /**
   * @return The standard name of the curve to use. Only used if the key-pair algorithm is EC.
   * @see #getKeyPairGenerationAlgorithm()
   */
  protected String getEllipticCurveName() {
    // Koblitz curve secp256k1 as recommended by <a href="http://www.secg.org/sec2-v2.pdf">Standards for Efficient Cryptography Group</a>.
    return "secp256k1";
  }

  /**
   * @return The algorithm to use for message digest (Hash)
   */
  protected String getDigestAlgorithm() {
    // SHA-512 hash algorithms defined in the <a href="http://csrc.nist.gov/publications/fips/fips180-4/fips-180-4.pdf">FIPS PUB 180-4</a>.
    return "SHA-512";
  }

  /**
   * @return The provider of the digest algorithm.
   * @see #getDigestAlgorithm()
   */
  protected String getDigestAlgorithmProvider() {
    return "SUN";
  }

  /**
   * @return The key-derivation algorithm (algorithm to create a key based on a password) to use for the
   *         encryption/decryption.
   */
  protected String getSecretKeyAlgorithm() {
    // Password-based key-derivation algorithm (<a href="http://tools.ietf.org/search/rfc2898">PKCS #5 2.0</a>)
    // using The HmacSHA algorithm (<a href="http://www.ietf.org/rfc/rfc2104.txt">RFC 2104</a>) as pseudo-random function.
    return "PBKDF2WithHmacSHA256";
  }

  /**
   * @return The algorithm to use for password hashing.
   */
  protected String getPasswordHashSecretKeyAlgorithm() {
    return "PBKDF2WithHmacSHA512";
  }

  /**
   * @return The algorithm to use for encryption/decryption.
   */
  protected String getCipherAlgorithm() {
    // Advanced Encryption Standard as specified by <a href="http://csrc.nist.gov/publications/fips/fips197/fips-197.pdf">NIST in FIPS 197</a>.
    // Also known as the Rijndael algorithm by Joan Daemen and Vincent Rijmen. AES is a 128-bit block cipher.
    return "AES";
  }

  /**
   * @return The provider of the encryption/decryption cipher.
   * @see #getCipherAlgorithm()
   */
  protected String getCipherAlgorithmProvider() {
    // Sun Java Cryptography Extension Provider
    return "SunJCE";
  }

  /**
   * @return The block mode to use for the encryption/decryption cipher.
   */
  protected String getCipherAlgorithmMode() {
    // Galois/Counter Mode (as defined in <a href="http://csrc.nist.gov/publications/nistpubs/800-38D/SP-800-38D.pdf">NIST Special Publication SP 800-38D</a>).
    return "GCM";
  }

  /**
   * @return the padding algorithm to use for encryption/decryption cipher.
   */
  protected String getCipherAlgorithmPadding() {
    // PKCS5 padding scheme (as defined in <a href="http://tools.ietf.org/html/rfc2898">PKCS #5</a>).
    return "PKCS5Padding";
  }

  @Override
  public void createSelfSignedCertificate(
      String certificateAlias,
      String x500Name,
      String storePass,
      String keyPass,
      int keyBits,
      int validDays,
      OutputStream out) {
    try {
      sun.security.tools.keytool.CertAndKeyGen certGen = new sun.security.tools.keytool.CertAndKeyGen("RSA", "SHA256WithRSA", null);
      certGen.generate(keyBits);
      sun.security.x509.X500Name name = new sun.security.x509.X500Name(x500Name);
      long validSecs = (long) validDays * 24L * 3600L;
      X509Certificate cert = certGen.getSelfCertificate(name, validSecs);
      PrivateKey privateKey = certGen.getPrivateKey();

      KeyStore ks = KeyStore.getInstance("jks");
      ks.load(null, storePass.toCharArray());
      ks.setKeyEntry(certificateAlias, privateKey, keyPass.toCharArray(), new X509Certificate[]{cert});
      ks.store(out, storePass.toCharArray());
    }
    catch (GeneralSecurityException e) {
      throw new ProcessingException("Security issue", e);
    }
    catch (IOException e) {
      throw new ProcessingException("IO issue", e);
    }
  }

  @Override
  public String keyStoreToHumanReadableText(InputStream keyStoreInput, String storePass, String keyPass) {
    StringWriter sw = new StringWriter();
    try (PrintWriter out = new PrintWriter(sw)) {
      KeyStore ks = KeyStore.getInstance("jks");
      ks.load(keyStoreInput, storePass.toCharArray());
      for (String alias : Collections.list(ks.aliases())) {
        out.println("Alias: " + alias);
        try {
          Certificate cert = ks.getCertificate(alias);
          if (cert != null) {
            out.println(" Certificate");
            out.println("  format: " + cert.getType());
            out.println("  base64: " + Base64Utility.encode(cert.getEncoded()));
            if (cert instanceof X509Certificate) {
              X509Certificate x = (X509Certificate) cert;
              out.println("  issuerDN: " + x.getIssuerDN());
              out.println("  subjectDN: " + x.getSubjectDN());
              out.println("  notBefore: " + x.getNotBefore());
              out.println("  notAfter: " + x.getNotAfter());
              out.println("  sigAlgName: " + x.getSigAlgName());
              out.println("  extendedKeyUsage: " + x.getExtendedKeyUsage());
              out.println("  serialNumber: " + x.getSerialNumber());
              out.println("  version: " + x.getVersion());
            }
            out.println(" PublicKey");
            out.println("  format: " + cert.getPublicKey().getFormat());
            out.println("  base64: " + Base64Utility.encode(cert.getPublicKey().getEncoded()));
            out.println("  algo: " + cert.getPublicKey().getAlgorithm());
          }
        }
        catch (Exception e) {
          out.println("Error reading entry as certificate: " + e);
        }
        if (keyPass != null) {
          try {
            Key key = ks.getKey(alias, keyPass.toCharArray());
            if (key != null) {
              out.println(" PrivateKey");
              out.println("  format: " + key.getFormat());
              out.println("  base64: " + Base64Utility.encode(key.getEncoded()));
              out.println("  algo: " + key.getAlgorithm());
            }
          }
          catch (Exception e) {
            out.println("Error reading entry as key: " + e);
          }
        }
      }
    }
    catch (IOException | GeneralSecurityException | RuntimeException e) {
      return "Error: " + e;
    }
    return sw.toString();
  }
}
