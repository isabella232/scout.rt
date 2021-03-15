/*
 * Copyright (c) 2010-2021 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 */
package org.eclipse.scout.rt.dataobject.testing.signature;

import static org.junit.Assert.*;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.regex.Matcher;

import org.eclipse.scout.rt.dataobject.IDataObjectMapper;
import org.eclipse.scout.rt.dataobject.IDoEntity;
import org.eclipse.scout.rt.dataobject.IPrettyPrintDataObjectMapper;
import org.eclipse.scout.rt.dataobject.TypeVersion;
import org.eclipse.scout.rt.platform.BEANS;
import org.eclipse.scout.rt.platform.exception.PlatformException;
import org.eclipse.scout.rt.platform.util.FileUtility;
import org.eclipse.scout.rt.platform.util.ObjectUtility;
import org.eclipse.scout.rt.platform.util.StringUtility;
import org.eclipse.scout.rt.testing.platform.runner.PlatformTestRunner;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Abstract test implementation for generating data object signature for each module.
 * <p>
 * The test will output a detailed list of changed data objects. Review the changes and act accordingly (e.g. add
 * migrations) before committing an updated signature file.
 * <p>
 * Due to the importance of a proper review the test is not self-healing, i.e. overwrites the existing signature file.
 * Instead a new file is created which should, after all test output is considered, be the new signature file.
 * <p>
 * Each module containing data objects with {@link TypeVersion} annotation must subclass this test.
 */
@RunWith(PlatformTestRunner.class)
public abstract class AbstractDataObjectSignatureTest {

  private static final Logger LOG = LoggerFactory.getLogger(AbstractDataObjectSignatureTest.class);

  protected abstract String getFilenamePrefix();

  /**
   * Only data object with matching package name prefixes are added to signature.
   */
  protected abstract Set<String> getPackageNamePrefixes();

  /**
   * @return filename without file extension
   */
  protected String getFilename() {
    return getFilenamePrefix() + "-dataobject-signature.json";
  }

  protected Class<?> getResourceBaseClass() {
    return this.getClass();
  }

  /**
   * Allows to filter for certain data object classes, e.g. exclude data objects from test packages for processing
   *
   * @return <code>true</code> if the provided data object class should be processed for signature generation,
   *         <code>false</code> otherwise.
   */
  protected boolean acceptDataObject(Class<? extends IDoEntity> dataObjectClass) {
    return true;
  }

  /**
   * Allows to filter for certain data object attributes, e.g. exclude a certain attribute of a specific data object
   * from further processing because verified separately.
   *
   * @return <code>true</code> if the provided data object attribute should be processed for signature generation,
   *         <code>false</code> otherwise.
   */
  protected boolean acceptAttribut(Class<? extends IDoEntity> dataObjectClass, String attributeName) {
    return true;
  }

  /**
   * Method may be overridden temporary to add type name, enum names, ... renamings to provide a more detailed
   * comparison.
   */
  protected void addRenamings(DataObjectSignatureComparator comparator) {
  }

  @Test
  public void testStructure() {
    DataObjectSignatureDo signature = BEANS.get(DataObjectSignatureGenerator.class).createSignature(getPackageNamePrefixes(), this::acceptDataObject, this::acceptAttribut);
    compareSignatures(signature);
  }

  protected void compareSignatures(DataObjectSignatureDo currentSignature) {
    IDataObjectMapper dataObjectMapper = BEANS.get(IPrettyPrintDataObjectMapper.class);

    DataObjectSignatureDo previousSignature = null;
    File referenceFile = new File(getApiSignatureJsonDirectory(), getFilename());
    if (!referenceFile.exists()) {
      writeCurrentSignature(referenceFile, currentSignature); // always write to final destination, do not use getOutputFile here
      fail("No previous signature file available. Initial data object signature file was created");
    }

    // Read previous signature file for comparison
    try (FileInputStream fis = new FileInputStream(referenceFile)) {
      previousSignature = dataObjectMapper.readValue(fis, DataObjectSignatureDo.class);
    }
    catch (IOException | RuntimeException e) { // runtime exception due to data object mapper
      writeCurrentSignature(getOutputFile(referenceFile), currentSignature);
      LOG.warn("Failed to read previous signature file", e);
      fail("Failed to read previous signature file.");
    }

    DataObjectSignatureComparator comparator = BEANS.get(DataObjectSignatureComparator.class);
    addRenamings(comparator);
    comparator.compare(previousSignature, currentSignature);

    // This is more a sanity check. If the data objects are not equal but there are no differences detected by the comparator, the comparator doesn't detect all differences yet.
    boolean differentDataObjects = !ObjectUtility.equals(previousSignature, currentSignature);
    if (!comparator.getDifferences().isEmpty() || differentDataObjects) {
      writeCurrentSignature(getOutputFile(referenceFile), currentSignature);
      String details = comparator.getDifferences().isEmpty() ? "Comparator was unable to detect the differences, please review file changes manually." : StringUtility.join("\n", comparator.getDifferences());
      fail("Review all API signature differences and create corresponding migrations if necessary before committing any changes in file " + getFilename() + ":\n" + details);
    }
  }

  protected File getOutputFile(File referenceFile) {
    // Test by default creates a new file to prevent accidental self-healing of test.
    // This behavior can be changed by setting the appropriate system property (not recommended).
    return System.getProperty("dataObjectSignatureTest.overwriteReferenceFile") != null ? referenceFile : new File(getApiSignatureJsonDirectory(), FileUtility.getFilenameParts(getFilename())[0] + "-to-be-reviewed" + ".json");
  }

  protected File getApiSignatureJsonDirectory() {
    File moduleDirectory = getModuleDirectory();

    String modulePath = getResourceBaseClass().getPackage().getName().replaceAll("\\.", Matcher.quoteReplacement(File.separator));
    return new File(moduleDirectory, "src/test/resources/" + modulePath + "/");
  }

  protected File getModuleDirectory() {
    // Replace the content of the out file when failing
    URL location = getClass().getProtectionDomain().getCodeSource().getLocation();
    if (!"file".equalsIgnoreCase(location.getProtocol())) {
      fail(String.format("not a file location (%s)", location));
    }

    try {
      File moduleDirectory = new File(location.toURI()).getParentFile().getParentFile();
      assertTrue("Module directory doesn't exist: " + moduleDirectory.getAbsolutePath(), moduleDirectory.exists());
      return moduleDirectory;
    }
    catch (URISyntaxException e) {
      throw new PlatformException("Failed to create URI from location {}", location, e);
    }
  }

  protected void writeCurrentSignature(File referenceFile, DataObjectSignatureDo signature) {
    if (!referenceFile.getParentFile().exists() && !referenceFile.getParentFile().mkdirs()) {
      LOG.warn("Unable to create target directory for reference file: {}", referenceFile.getParentFile()); // in case directory doesn't exist yet (e.g. initial test execution)
      // still trying to write file itself, maybe it works
    }

    String currentSignatureJson = BEANS.get(IPrettyPrintDataObjectMapper.class).writeValue(signature);
    currentSignatureJson = currentSignatureJson.replaceAll("\\r\\n", "\\\n").trim(); // only use \n

    try (OutputStream out = new FileOutputStream(referenceFile)) {
      out.write(currentSignatureJson.getBytes(StandardCharsets.UTF_8));
    }
    catch (IOException e) {
      throw new PlatformException("Failed to write new signature file", e);
    }
  }
}
