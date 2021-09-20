using System;
using System.Collections.Generic;
using System.IO;
using System.Xml;
using System.Xml.Xsl;

namespace Blixt.Xsl
{
    /// <summary>
    /// A cache for keeping compiled XSLT documents in memory and retrieving them on
    /// request.
    /// </summary>
    /// <remarks>
    /// Copyright (c) 2007 Andreas Blixt &lt;andreas@blixt.org&gt;
    /// License: MIT license &lt;http://www.opensource.org/licenses/mit-license.php&gt;
    /// Project homepage: &lt;http://blixt.googlecode.com/&gt;
    /// </remarks>
    public class XsltCache
    {
        /// <summary>
        /// Represents a cached XSLT document.
        /// </summary>
        private class XslCachedTransform
        {
            private Dictionary<string, DateTime> includes = new Dictionary<string, DateTime>();
            private DateTime lastModified;
            private string path;
            private XslCompiledTransform transform;

            /// <summary>
            /// The time at which the document was last modified.
            /// </summary>
            public DateTime LastModified
            {
                get { return lastModified; }
            }

            /// <summary>
            /// The document that is cached.
            /// </summary>
            public XslCompiledTransform Transform
            {
                get { return transform; }
            }

            public XslCachedTransform(string xslt)
            {
                lastModified = File.GetLastWriteTime(xslt);
                path = xslt;

                List<string> includedFiles = GetXsltIncludes(xslt);
                foreach (string includedFile in includedFiles)
                {
                    if (!includes.ContainsKey(includedFile))
                    {
                        includes.Add(includedFile, File.GetLastWriteTime(includedFile));
                    }
                }

                transform = new XslCompiledTransform(true);
                XsltSettings settings = new XsltSettings(true, true);
                transform.Load(xslt, settings, new XmlUrlResolver());
            }

            /// <summary>
            /// Checks whether the cached XSLT document is current with the one on disk.
            /// </summary>
            /// <returns>true if the cached XSLT document is current; otherwise false.</returns>
            public bool CheckIfCurrent()
            {
                if (LastModified != File.GetLastWriteTime(path)) return false;

                foreach (KeyValuePair<string, DateTime> include in includes)
                {
                    if (include.Value != File.GetLastWriteTime(include.Key)) return false;
                }

                return true;
            }
        }

        private Dictionary<string, XslCachedTransform> cache = new Dictionary<string, XslCachedTransform>();

        /// <summary>
        /// Retrieves the specified XSLT document from the cache or from disk
        /// if the document is not in the cache.
        /// </summary>
        /// <param name="xsl">The path to the XSLT document that is to be retrieved.</param>
        /// <returns></returns>
        public XslCompiledTransform GetTransform(string xslt)
        {
            XslCachedTransform cached;
            if (cache.ContainsKey(xslt))
            {
                cached = cache[xslt];
                if (!cached.CheckIfCurrent())
                {
                    cache[xslt] = cached = new XslCachedTransform(xslt);
                }
            }
            else
            {
                cache[xslt] = cached = new XslCachedTransform(xslt);
            }

            return cached.Transform;
        }

        /// <summary>
        /// Retrieves a list of XSLT documents that are directly or
        /// indirectly included by the specified XSLT document.
        /// </summary>
        /// <param name="xsl">The path to the XSLT document that is to be retrieved.</param>
        /// <returns>A list of all directly or indirectly included XSLT documents.</returns>
        private static List<string> GetXsltIncludes(string xslt)
        {
            XmlDocument transform = new XmlDocument();
            transform.Load(xslt);

            // Select all <xsl:include> nodes.
            XmlNamespaceManager manager = new XmlNamespaceManager(transform.NameTable);
            manager.AddNamespace("xsl", "http://www.w3.org/1999/XSL/Transform");
            XmlNodeList nodes = transform.SelectNodes("//xsl:include", manager);

            // Get the path to the directory of the main XSLT document.
            string basePath = Path.GetDirectoryName(xslt);

            List<string> includes = new List<string>();
            
            foreach (XmlNode node in nodes)
            {
                string filename = node.Attributes["href"].Value;
                
                string path = Path.Combine(basePath, filename);
                includes.Add(path);

                // Recursively search for indirectly included XSLT documents.
                includes.AddRange(GetXsltIncludes(path));
            }

            return includes;
        }
    }
}
