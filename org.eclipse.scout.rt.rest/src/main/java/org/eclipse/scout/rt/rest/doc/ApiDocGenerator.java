/*
 * Copyright (c) 2019 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 */
package org.eclipse.scout.rt.rest.doc;

import java.io.IOException;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.lang.reflect.Parameter;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.chrono.IsoChronology;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.FormatStyle;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.HEAD;
import javax.ws.rs.HttpMethod;
import javax.ws.rs.OPTIONS;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.eclipse.scout.rt.dataobject.DoEntity;
import org.eclipse.scout.rt.dataobject.DoEntityBuilder;
import org.eclipse.scout.rt.dataobject.IPrettyPrintDataObjectMapper;
import org.eclipse.scout.rt.platform.ApplicationScoped;
import org.eclipse.scout.rt.platform.BEANS;
import org.eclipse.scout.rt.platform.config.CONFIG;
import org.eclipse.scout.rt.platform.config.PlatformConfigProperties.ApplicationNameProperty;
import org.eclipse.scout.rt.platform.config.PlatformConfigProperties.ApplicationVersionProperty;
import org.eclipse.scout.rt.platform.exception.DefaultRuntimeExceptionTranslator;
import org.eclipse.scout.rt.platform.holders.StringHolder;
import org.eclipse.scout.rt.platform.html.HTML;
import org.eclipse.scout.rt.platform.html.HtmlHelper;
import org.eclipse.scout.rt.platform.html.IHtmlContent;
import org.eclipse.scout.rt.platform.html.IHtmlDocument;
import org.eclipse.scout.rt.platform.html.IHtmlElement;
import org.eclipse.scout.rt.platform.nls.NlsLocale;
import org.eclipse.scout.rt.platform.text.TEXTS;
import org.eclipse.scout.rt.platform.util.FileUtility;
import org.eclipse.scout.rt.platform.util.IOUtility;
import org.eclipse.scout.rt.platform.util.ObjectUtility;
import org.eclipse.scout.rt.platform.util.StringUtility;
import org.eclipse.scout.rt.platform.util.date.DateUtility;
import org.eclipse.scout.rt.rest.IRestResource;

/**
 * Usage in a REST resource:
 *
 * <pre>
 * &#64;GET
 * &#64;Path("doc")
 * &#64;ApiDocIgnore
 * public Response getDocAsHtml(@QueryParam(ApiDocGenerator.STATIC_RESOURCE_PARAM) String staticResource) {
 *   return BEANS.get(ApiDocGenerator.class).getWebContent(staticResource);
 * }
 *
 * &#64;GET
 * &#64;Path("doc/csv")
 * &#64;ApiDocIgnore
 * &#64;Produces(MediaType.TEXT_PLAIN)
 * public Response getDocAsText() {
 *   return BEANS.get(ApiDocGenerator.class).getTextContent();
 * }
 *
 * &#64;GET
 * &#64;Path("doc/json")
 * &#64;ApiDocIgnore
 * &#64;Produces(MediaType.APPLICATION_JSON)
 * public Response getDocAsJson() {
 *   return BEANS.get(ApiDocGenerator.class).getJsonContent();
 * }
 * </pre>
 */
@ApplicationScoped
public class ApiDocGenerator {

  /**
   * Query parameter for static resource file names. This is used by HTML content generated by
   * {@link #getWebContent(String)}.
   */
  public static final String STATIC_RESOURCE_PARAM = "r";

  protected static final String TEXT_ELEMENT_SEPARATOR = "\t";
  protected static final String TEXT_LINE_SEPARATOR = "\n";

  public List<ResourceDescriptor> getResourceDescriptors() {
    return BEANS.all(IRestResource.class).stream()
        .filter(this::acceptRestResource)
        .sorted(Comparator.comparing(res -> res.getClass().getSimpleName()))
        .sorted(Comparator.comparing(res -> "/" + getPath(res)))
        .map(this::toResourceDescriptor)
        .filter(Objects::nonNull)
        .collect(Collectors.toList());
  }

  protected ResourceDescriptor toResourceDescriptor(IRestResource resource) {
    String resourcePath = "/" + getPath(resource);
    String basePath = resourcePath.replaceAll("(/[^/]+).*", "$1");
    String name = resource.getClass().getSimpleName();
    String anchor = resource.getClass().getSimpleName();
    DescriptionDescriptor description = generateResourceDescription(resource);

    return new ResourceDescriptor()
        .withResource(resource)
        .withPath(resourcePath)
        .withBasePath(basePath)
        .withName(name)
        .withAnchor(anchor)
        .withDescription(description)
        .withMethods(Stream.of(resource.getClass().getMethods())
            .filter(this::acceptMethod)
            .sorted(Comparator.comparing(this::generateMethodSignature)) // to make sure sorting is stable
            .sorted(this::compareMethods)
            .map(this::toMethodDescriptor)
            .filter(Objects::nonNull)
            .collect(Collectors.toList()));
  }

  protected MethodDescriptor toMethodDescriptor(Method m) {
    String httpMethod = getHttpMethod(m);
    if (httpMethod == null) {
      return null;
    }

    String path = getPath(m);
    String signature = generateMethodSignature(m);
    DescriptionDescriptor description = generateMethodDescription(m);
    String produces = getProduces(m);
    String consumes = getConsumes(m);

    return new MethodDescriptor()
        .withMethod(m)
        .withHttpMethod(httpMethod)
        .withPath(path)
        .withSignature(signature)
        .withDescription(description)
        .withConsumes(consumes)
        .withProduces(produces);
  }

  protected DescriptionDescriptor toDescriptionDescriptor(ApiDocDescription desc) {
    if (desc == null) {
      return null;
    }

    String text = null;
    if (StringUtility.hasText(desc.text())) {
      text = desc.text();
    }
    else if (StringUtility.hasText(desc.textKey())) {
      text = TEXTS.get(desc.textKey());
    }

    if (!StringUtility.hasText(text)) {
      return null;
    }
    return DescriptionDescriptor.of(text, desc.htmlEnabled());
  }

  protected boolean acceptRestResource(IRestResource res) {
    return res.getClass().isAnnotationPresent(Path.class) &&
        !res.getClass().isAnnotationPresent(ApiDocIgnore.class);
  }

  protected boolean acceptMethod(Method m) {
    return Modifier.isPublic(m.getModifiers()) &&
        !m.isAnnotationPresent(ApiDocIgnore.class);
  }

  protected int compareMethods(Method m1, Method m2) {
    // Sorts method according to their @Path annotation value.
    // Unlike String.compareTo(), this puts "{" after everything else.
    // This causes "/my/resource" to be sorted before "/my/resource/{id}".
    String p1 = getPath(m1);
    String p2 = getPath(m2);
    if (p1 == null && p2 == null) {
      return 0;
    }
    if (p1 == null) {
      return -1;
    }
    if (p2 == null) {
      return 1;
    }
    int len1 = p1.length();
    int len2 = p2.length();
    int lim = Math.min(len1, len2);
    for (int i = 0; i < lim; i++) {
      char c1 = p1.charAt(i);
      char c2 = p2.charAt(i);
      if (c1 != c2) {
        int c = c1 - c2;
        if (c1 == '{' || c2 == '{') {
          c *= -1;
        }
        return c;
      }
    }
    return len1 - len2;
  }

  protected String getHttpMethod(Method m) {
    // Generic annotation
    HttpMethod httpMethod = m.getAnnotation(HttpMethod.class);
    if (httpMethod != null) {
      return httpMethod.value();
    }
    // Convenience annotations
    if (m.getAnnotation(GET.class) != null) {
      return HttpMethod.GET;
    }
    if (m.getAnnotation(POST.class) != null) {
      return HttpMethod.POST;
    }
    if (m.getAnnotation(PUT.class) != null) {
      return HttpMethod.PUT;
    }
    if (m.getAnnotation(DELETE.class) != null) {
      return HttpMethod.DELETE;
    }
    if (m.getAnnotation(OPTIONS.class) != null) {
      return HttpMethod.OPTIONS;
    }
    if (m.getAnnotation(HEAD.class) != null) {
      return HttpMethod.HEAD;
    }
    return null;
  }

  protected String getProduces(Method m) {
    Produces produces = m.getAnnotation(Produces.class);
    if (produces != null) {
      return StringUtility.join(",", produces.value());
    }
    return null;
  }

  protected String getConsumes(Method m) {
    Consumes consumes = m.getAnnotation(Consumes.class);
    if (consumes != null) {
      return StringUtility.join(",", consumes.value());
    }
    return null;
  }

  protected String getPath(IRestResource res) {
    Path path = res.getClass().getAnnotation(Path.class);
    return (path != null ? stripSlashes(path.value()) : null);
  }

  protected String getPath(Method m) {
    Path path = m.getAnnotation(Path.class);
    return (path != null ? stripSlashes(path.value()) : null);
  }

  protected DescriptionDescriptor generateResourceDescription(IRestResource res) {
    return ObjectUtility.nvl(toDescriptionDescriptor(res.getClass().getAnnotation(ApiDocDescription.class)), DescriptionDescriptor.NONE);
  }

  protected String generateMethodSignature(Method m) {
    StringBuilder sb = new StringBuilder();
    for (Parameter param : m.getParameters()) {
      if (sb.length() > 0) {
        sb.append(", ");
      }
      String paramName = param.getName();
      if (param.isAnnotationPresent(PathParam.class)) {
        paramName = param.getAnnotation(PathParam.class).value();
      }
      else if (param.isAnnotationPresent(QueryParam.class)) {
        paramName = param.getAnnotation(QueryParam.class).value();
      }
      else if (param.isAnnotationPresent(ApiDocParam.class)) {
        paramName = param.getAnnotation(ApiDocParam.class).value();
      }
      sb.append(param.getType().getSimpleName() + " " + paramName);
    }
    String ex = "";
    if (m.getExceptionTypes().length > 0) {
      ex = " throws " + Arrays.stream(m.getExceptionTypes()).map(Class::getSimpleName).collect(Collectors.joining(", "));
    }
    return m.getReturnType().getSimpleName() + " " + m.getName() + "(" + sb.toString() + ")" + ex;
  }

  protected DescriptionDescriptor generateMethodDescription(Method m) {
    return ObjectUtility.nvlOpt(toDescriptionDescriptor(m.getAnnotation(ApiDocDescription.class)), () -> generateMethodDescriptionFallback(m));
  }

  protected DescriptionDescriptor generateMethodDescriptionFallback(Method m) {
    // Fallback: convert method name from camel case to human readable text.
    // (?<=...) positive look-behind
    // (?=...)  positive look-ahead
    String[] nameParts = m.getName().split("(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])");
    if (nameParts.length == 0) {
      return null;
    }
    String text = IntStream.range(0, nameParts.length)
        .mapToObj(i -> {
          String word = StringUtility.lowercase(nameParts[i]);
          if (isAcronym(word)) {
            return StringUtility.uppercase(word);
          }
          return (i == 0 ? StringUtility.uppercaseFirst(word) : word);
        })
        .collect(Collectors.joining(" ")) + (StringUtility.equalsIgnoreCase(nameParts[0], "is") ? "?" : ".");
    return DescriptionDescriptor.of(text, false);
  }

  protected boolean isAcronym(String lowercaseWord) {
    return ObjectUtility.isOneOf(lowercaseWord, "api", "url", "uri", "html", "xml", "svg", "csv", "crm", "erp", "esb", "id", "uid", "uuid", "guid", "qr");
  }

  protected String generateTitle() {
    String title = StringUtility.join(" ",
        CONFIG.getPropertyValue(ApplicationNameProperty.class),
        "API",
        StringUtility.box("(", CONFIG.getPropertyValue(ApplicationVersionProperty.class), ")"));
    return title;
  }

  /**
   * Returns a generated API documentation in HTML format. The resulting HTML code may reference static resources files
   * (CSS, JS) that are also served by this method. The referenced URLs are relative to the main page and use a query
   * parameter named {@link #STATIC_RESOURCE_PARAM}. A REST resource should capture this parameter using a
   * &#64;{@link QueryParam} annotation with the aforementioned param name constant and pass it to this method.
   *
   * @param resourceFilename
   *          If <code>null</code>, the main HTML page is returned. All other values are treated as relative filenames
   *          of static resources.
   */
  public Response getWebContent(String resourceFilename) {
    // Static resources
    if (resourceFilename != null) {
      return getStaticResource(resourceFilename);
    }

    // Main HTML content
    final IHtmlDocument html = toHtml(getResourceDescriptors());
    return Response.ok()
        .type(MediaType.TEXT_HTML)
        .entity(html.toHtml())
        .build();
  }

  protected IHtmlDocument toHtml(List<ResourceDescriptor> resourceDescriptors) {
    final List<IHtmlElement> tocElements = new ArrayList<>();
    final List<IHtmlElement> elements = new ArrayList<>();
    final StringHolder currentBasePath = new StringHolder();

    resourceDescriptors.stream().forEach(r -> {
      if (!ObjectUtility.equals(currentBasePath.getValue(), r.getBasePath())) {
        String first = (currentBasePath.getValue() == null ? " first" : "");
        currentBasePath.setValue(r.getBasePath());
        tocElements.add(HTML.div(r.getBasePath()).cssClass("toc-section" + first));
      }

      tocElements.add(HTML.div(HTML.link("#" + r.getAnchor(), r.getName()).cssClass("toc-link")).cssClass("toc-item"));

      elements.add(HTML.tag("a").addAttribute("name", r.getAnchor()));
      elements.add(HTML.h2(
          r.getName(),
          HTML.link("#" + r.getAnchor(), "\u2693\uFE0E") // anchor + "VS15 variant selector = text style"
              .cssClass("title-link first")
              .addAttribute("title", "Link to this section"),
          HTML.link("#", "\u2B61") // up arrow
              .cssClass("title-link")
              .addAttribute("title", "Go to top"))
          .cssClass("title"));

      if (!r.getDescription().isEmpty()) {
        elements.add(HTML.div(HTML.raw(r.getDescription().toHtml())).cssClass("resource-description"));
      }

      r.getMethods().stream().forEach(m -> elements.add(HTML.div(
          HTML.div(
              HTML.div(m.getHttpMethod()).cssClass("http " + m.getHttpMethod().toLowerCase()),
              HTML.div(
                  HTML.span(r.getPath()).cssClass("resource"),
                  HTML.span(StringUtility.box("/", m.getPath(), "")).cssClass("method")).cssClass("path"))
              .cssClass("header"),
          HTML.div(
              HTML.div(HTML.raw(m.getDescription().toHtml())).cssClass("description"),
              HTML.div(m.getSignature()).cssClass("signature"),
              HTML.div(
                  StringUtility.hasText(m.getConsumes()) ? HTML.div(HTML.span("Consumes ").cssClass("k"), HTML.span(m.getConsumes()).cssClass("v")).cssClass("line") : null,
                  StringUtility.hasText(m.getProduces()) ? HTML.div(HTML.span("Produces ").cssClass("k"), HTML.span(m.getProduces()).cssClass("v")).cssClass("line") : null)
                  .cssClass("consumes-produces"))
              .cssClass("body"))
          .cssClass("operation")));
    });

    final String title = generateTitle();

    final IHtmlElement toc = tocElements.isEmpty()
        ? null
        : HTML.div(
            HTML.div("Table of Contents").cssClass("toc-title"),
            HTML.fragment(tocElements)).cssClass("toc");

    final IHtmlContent mainContent = elements.isEmpty()
        ? HTML.div("No resources available.")
        : HTML.fragment(elements);

    final String generatedDate = DateUtility.format(new Date(), DateTimeFormatterBuilder
        .getLocalizedDateTimePattern(FormatStyle.SHORT, FormatStyle.MEDIUM, IsoChronology.INSTANCE, NlsLocale.get())
        .replaceAll("y+", "yyyy"));

    return buildHtmlDocument(title, toc, mainContent, generatedDate);
  }

  protected IHtmlDocument buildHtmlDocument(String title, IHtmlElement toc, IHtmlContent mainContent, String generatedDate) {
    return HTML.html5(
        HTML.head(
            HTML.tag("meta")
                .addAttribute("charset", "utf-8"),
            HTML.tag("meta")
                .addAttribute("name", "viewport")
                .addAttribute("content", "width=device-width, initial-scale=1.0"),
            HTML.tag("meta")
                .addAttribute("http-equiv", "X-UA-Compatible")
                .addAttribute("content", "IE=edge"),
            HTML.tag("title", title),
            HTML.tag("link")
                .addAttribute("rel", "stylesheet")
                .addAttribute("type", "text/css")
                .addAttribute("href", "?" + STATIC_RESOURCE_PARAM + "=doc.css"),
            HTML.tag("script").addAttribute("src", "?" + STATIC_RESOURCE_PARAM + "=doc.js")),
        HTML.body(
            HTML.h1(title),
            toc,
            mainContent,
            HTML.div(HTML.div("Generated on " + generatedDate).cssClass("info")).cssClass("footer")));
  }

  protected Response getStaticResource(String filename) {
    String data = readStaticFile(filename);
    if (data == null) {
      // 404 Not found
      return Response.status(Status.NOT_FOUND).build();
    }
    return Response.ok()
        .entity(data)
        .type(FileUtility.getMimeType(filename))
        .build();
  }

  /**
   * Returns the content of the given file if it exists, or <code>null</code> otherwise.
   * <p>
   * <i>filename</i> is a relative path. It will be prefixed with <code>"res/"</code> by this method and is then passed
   * to this class' {@link Class#getResource(String)} method.
   */
  protected String readStaticFile(String filename) {
    if (!StringUtility.hasText(filename)) {
      return null;
    }
    URL url = getClass().getResource("res/" + filename.replaceAll("^/", ""));
    if (url == null) {
      return null;
    }
    try {
      return new String(IOUtility.readFromUrl(url), StandardCharsets.UTF_8);
    }
    catch (IOException e) {
      throw BEANS.get(DefaultRuntimeExceptionTranslator.class).translate(e);
    }
  }

  protected String stripSlashes(String s) {
    if (s == null) {
      return null;
    }
    return s.replaceAll("^/+|/+$", "");
  }

  /**
   * Returns a generated API documentation in plain text format.
   * <p>
   * The first line contains a list of the returned fields (header). Each subsequent line describes one API call:
   * <ul>
   * <li><b>resource</b>
   * <li><b>method</b>
   * <li><b>path</b>
   * <li><b>consumes</b>
   * <li><b>produces</b>
   * <li><b>description</b> (without line breaks)
   * </ul>
   * Lines are separated by {@link #TEXT_LINE_SEPARATOR}, fields are separated by {@link #TEXT_ELEMENT_SEPARATOR}.
   */
  public Response getTextContent() {
    final String content = toText(getResourceDescriptors());
    return Response.ok()
        .type(MediaType.TEXT_PLAIN)
        .entity(content)
        .build();
  }

  protected String toText(List<ResourceDescriptor> resourceDescriptors) {
    final StringBuilder sb = new StringBuilder();

    // append header
    sb.append("resource");
    sb.append(TEXT_ELEMENT_SEPARATOR);
    sb.append("method");
    sb.append(TEXT_ELEMENT_SEPARATOR);
    sb.append("path");
    sb.append(TEXT_ELEMENT_SEPARATOR);
    sb.append("consumes");
    sb.append(TEXT_ELEMENT_SEPARATOR);
    sb.append("produces");
    sb.append(TEXT_ELEMENT_SEPARATOR);
    sb.append("description");
    sb.append(TEXT_LINE_SEPARATOR);

    // append all resources and methods
    resourceDescriptors.stream().forEach(r -> r.getMethods().stream().forEach(m -> {
      sb.append(r.getName());
      sb.append(TEXT_ELEMENT_SEPARATOR);
      sb.append(m.getHttpMethod());
      sb.append(TEXT_ELEMENT_SEPARATOR);
      sb.append(r.getPath());
      if (!StringUtility.isNullOrEmpty(m.getPath())) {
        sb.append("/");
        sb.append(m.getPath());
      }
      sb.append(TEXT_ELEMENT_SEPARATOR);
      sb.append(StringUtility.emptyIfNull(m.getConsumes()));
      sb.append(TEXT_ELEMENT_SEPARATOR);
      sb.append(StringUtility.emptyIfNull(m.getProduces()));
      sb.append(TEXT_ELEMENT_SEPARATOR);
      sb.append(m.getDescription().toPlainText(true));
      sb.append(TEXT_LINE_SEPARATOR);
    }));
    return sb.toString();
  }

  /**
   * Returns a generated API documentation in JSON format.
   * <p>
   * The result is an array of objects with the following fields:
   * <ul>
   * <li><b>resource</b>
   * <li><b>method</b>
   * <li><b>path</b>
   * <li><b>description</b>
   * <li><b>signature</b>
   * <li><b>consumes</b>
   * <li><b>produces</b>
   * </ul>
   */
  public Response getJsonContent() {
    final String content = toJsonString(getResourceDescriptors());
    return Response.ok()
        .type(MediaType.APPLICATION_JSON)
        .entity(content)
        .build();
  }

  protected String toJsonString(List<ResourceDescriptor> resourceDescriptors) {
    List<DoEntity> jsonMethods = resourceDescriptors.stream()
        .flatMap(r -> r.getMethods().stream()
            .map(m -> BEANS.get(DoEntityBuilder.class)
                .put("resource", r.getName())
                .put("method", m.getHttpMethod())
                .put("path", StringUtility.join("/", r.getPath(), m.getPath()))
                .put("description", m.getDescription().toPlainText(false))
                .put("signature", m.getSignature())
                .putIf("consumes", m.getConsumes(), Objects::nonNull)
                .putIf("produces", m.getProduces(), Objects::nonNull)
                .build()))
        .collect(Collectors.toList());
    return BEANS.get(IPrettyPrintDataObjectMapper.class).writeValue(jsonMethods);
  }

  public static class ResourceDescriptor {

    private IRestResource m_resource;

    private String m_path;
    private String m_basePath; // first segment of "path"
    private String m_name;
    private String m_anchor;
    private DescriptionDescriptor m_description;

    private List<MethodDescriptor> m_methods;

    public IRestResource getResource() {
      return m_resource;
    }

    public ResourceDescriptor withResource(IRestResource resource) {
      m_resource = resource;
      return this;
    }

    public String getPath() {
      return m_path;
    }

    public ResourceDescriptor withPath(String path) {
      m_path = path;
      return this;
    }

    public String getBasePath() {
      return m_basePath;
    }

    public ResourceDescriptor withBasePath(String basePath) {
      m_basePath = basePath;
      return this;
    }

    public String getName() {
      return m_name;
    }

    public ResourceDescriptor withName(String name) {
      m_name = name;
      return this;
    }

    public String getAnchor() {
      return m_anchor;
    }

    public ResourceDescriptor withAnchor(String anchor) {
      m_anchor = anchor;
      return this;
    }

    public DescriptionDescriptor getDescription() {
      return m_description;
    }

    public ResourceDescriptor withDescription(DescriptionDescriptor description) {
      m_description = description;
      return this;
    }

    public List<MethodDescriptor> getMethods() {
      return m_methods;
    }

    public ResourceDescriptor withMethods(List<MethodDescriptor> methods) {
      m_methods = methods;
      return this;
    }
  }

  public static class MethodDescriptor {

    private Method m_method;

    private String m_httpMethod;
    private String m_path;

    private String m_signature;
    private DescriptionDescriptor m_description;

    private String m_consumes;
    private String m_produces;

    public Method getMethod() {
      return m_method;
    }

    public MethodDescriptor withMethod(Method method) {
      m_method = method;
      return this;
    }

    public String getHttpMethod() {
      return m_httpMethod;
    }

    public MethodDescriptor withHttpMethod(String httpMethod) {
      m_httpMethod = httpMethod;
      return this;
    }

    public String getPath() {
      return m_path;
    }

    public MethodDescriptor withPath(String path) {
      m_path = path;
      return this;
    }

    public String getSignature() {
      return m_signature;
    }

    public MethodDescriptor withSignature(String signature) {
      m_signature = signature;
      return this;
    }

    public DescriptionDescriptor getDescription() {
      return m_description;
    }

    public MethodDescriptor withDescription(DescriptionDescriptor description) {
      m_description = description;
      return this;
    }

    public String getConsumes() {
      return m_consumes;
    }

    public MethodDescriptor withConsumes(String consumes) {
      m_consumes = consumes;
      return this;
    }

    public String getProduces() {
      return m_produces;
    }

    public MethodDescriptor withProduces(String produces) {
      m_produces = produces;
      return this;
    }
  }

  public static class DescriptionDescriptor {

    private String m_rawDescription;
    private boolean m_htmlEnabled;

    public static final DescriptionDescriptor NONE = of(null, false);

    public static DescriptionDescriptor of(String rawDescription, boolean htmlEnabled) {
      return new DescriptionDescriptor()
          .withRawDescription(rawDescription)
          .withHtmlEnabled(htmlEnabled);
    }

    public String getRawDescription() {
      return m_rawDescription;
    }

    public DescriptionDescriptor withRawDescription(String description) {
      m_rawDescription = description;
      return this;
    }

    public boolean isHtmlEnabled() {
      return m_htmlEnabled;
    }

    public DescriptionDescriptor withHtmlEnabled(boolean htmlEnabled) {
      m_htmlEnabled = htmlEnabled;
      return this;
    }

    public boolean isEmpty() {
      return !StringUtility.hasText(m_rawDescription);
    }

    public String toHtml() {
      return (m_htmlEnabled ? m_rawDescription : BEANS.get(HtmlHelper.class).escapeAndNewLineToBr(m_rawDescription));
    }

    public String toPlainText(boolean removeNewLines) {
      String plainText = (m_htmlEnabled ? BEANS.get(HtmlHelper.class).toPlainText(m_rawDescription) : m_rawDescription);
      return (removeNewLines ? StringUtility.removeNewLines(plainText) : plainText);
    }
  }
}
