using System;
using System.Security.Cryptography;

namespace Blixt.Utilities
{
    /// <summary>
    /// Represents a SHA-1 hash of a set of data.
    /// </summary>
    /// <remarks>
    /// Copyright (c) 2007 Andreas Blixt &lt;andreas@blixt.org&gt;
    /// License: MIT license &lt;http://www.opensource.org/licenses/mit-license.php&gt;
    /// Project homepage: &lt;http://blixt.googlecode.com/&gt;
    /// </remarks>
    public sealed class Sha1 : Hash
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
                if (value == null || value.Length != 20)
                    throw new ArgumentException("Value must be a byte array with the size 20.");

                data = value;
            }
        }
        #endregion

        #region [ Constructor ]
        public Sha1() { }

        public Sha1(byte[] hash)
        {
            Data = hash;
        }
        #endregion

        public override byte[] ComputeHash(byte[] data)
        {
            SHA1 sha = SHA1.Create();
            return sha.ComputeHash(data);
        }
    }
}
