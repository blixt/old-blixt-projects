using System;
using System.Security.Cryptography;

namespace Blixt.Utilities
{
    /// <summary>
    /// Represents an MD5 hash of a set of data.
    /// </summary>
    /// <remarks>
    /// Copyright (c) 2007 Andreas Blixt &lt;andreas@blixt.org&gt;
    /// License: MIT license &lt;http://www.opensource.org/licenses/mit-license.php&gt;
    /// Project homepage: &lt;http://blixt.googlecode.com/&gt;
    /// </remarks>
    public sealed class Md5 : Hash
    {
        #region [ Variables ]
        private byte[] data;
        #endregion

        #region [ Properties ]
        public override byte[] Data
        {
            get { return data; }
            set
            {
                if (value == null || value.Length != 16)
                    throw new ArgumentException("Value must be a byte array with the size 16.");

                data = value;
            }
        }
        #endregion

        #region [ Constructor ]
        public Md5() { }

        public Md5(byte[] hash)
        {
            Data = hash;
        }
        #endregion

        public override byte[] ComputeHash(byte[] data)
        {
            MD5 md = MD5.Create();
            return md.ComputeHash(data);
        }
    }
}
