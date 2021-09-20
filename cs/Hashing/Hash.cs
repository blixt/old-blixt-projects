using System.Runtime.Remoting.Metadata.W3cXsd2001;
using System.Text;

namespace Blixt.Utilities
{
    /// <summary>
    /// Represents a hash of a set of data.
    /// </summary>
    /// <remarks>
    /// Copyright (c) 2007 Andreas Blixt &lt;andreas@blixt.org&gt;
    /// License: MIT license &lt;http://www.opensource.org/licenses/mit-license.php&gt;
    /// Project homepage: &lt;http://blixt.googlecode.com/&gt;
    /// </remarks>
    public abstract class Hash
    {
        #region [ Static members ]
        public static T Get<T>(byte[] data)
            where T : Hash, new()
        {
            T hasher = new T();
            hasher.Data = hasher.ComputeHash(data);
            return hasher;
        }

        public static T Get<T>(string data)
            where T : Hash, new()
        {
            UTF8Encoding e = new UTF8Encoding();
            return Get<T>(e.GetBytes(data));
        }

        public static T Parse<T>(string hash)
            where T : Hash, new()
        {
            T hasher = new T();
            hasher.Data = SoapHexBinary.Parse(hash).Value;
            return hasher;
        }

        public static bool Validate<T>(byte[] data, byte[] hash)
            where T : Hash, new()
        {
            byte[] newHash = Get<T>(data).Data;
            for (int i = 0; i < hash.Length; i++)
            {
                if (newHash[i] != hash[i]) return false;
            }

            return true;
        }

        public static bool Validate<T>(byte[] data, string hash)
            where T : Hash, new()
        {
            return Validate<T>(data, Parse<T>(hash).Data);
        }

        public static bool Validate<T>(string data, byte[] hash)
            where T : Hash, new()
        {
            UTF8Encoding e = new UTF8Encoding();
            return Validate<T>(e.GetBytes(data), hash);
        }

        public static bool Validate<T>(string data, string hash)
            where T : Hash, new()
        {
            UTF8Encoding e = new UTF8Encoding();
            return Validate<T>(e.GetBytes(data), Parse<T>(hash).Data);
        }
        #endregion

        #region [ Properties ]
        /// <summary>
        /// Gets or sets the binary representation of the hash.
        /// </summary>
        public abstract byte[] Data { get; set; }
        #endregion

        /// <summary>
        /// Calculates the hash of the given data.
        /// </summary>
        /// <param name="data">The data with which to create the hash.</param>
        public abstract byte[] ComputeHash(byte[] data);

        /// <summary>
        /// Retrieves the hexadecimal representation of the hash.
        /// </summary>
        /// <returns>The hexadecimal representation of the hash.</returns>
        public override string ToString()
        {
            SoapHexBinary shb = new SoapHexBinary(Data);
            return shb.ToString();
        }

        /// <summary>
        /// Validates the data against the current hash.
        /// </summary>
        /// <param name="data">The data to validate.</param>
        /// <returns>true if the data matches the hash; otherwise, false.</returns>
        public bool Validate(byte[] data)
        {
            byte[] newHash = ComputeHash(data);
            for (int i = 0; i < Data.Length; i++)
            {
                if (newHash[i] != Data[i]) return false;
            }

            return true;
        }

        /// <summary>
        /// Validates the data against the current hash.
        /// </summary>
        /// <param name="data">The string to validate.</param>
        /// <returns>true if the data matches the hash; otherwise, false.</returns>
        public bool Validate(string data)
        {
            UTF8Encoding e = new UTF8Encoding();
            return Validate(e.GetBytes(data));
        }
    }
}
