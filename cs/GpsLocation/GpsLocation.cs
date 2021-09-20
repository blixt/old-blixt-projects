using System;

namespace Blixt.Utilities
{
    /// <summary>
    /// Represents a GPS coordinate (latitude and longitude).
    /// Supports calculation of the distance between two GPS coordinates.
    /// </summary>
    /// <remarks>
    /// Copyright (c) 2008 Andreas Blixt &lt;andreas@blixt.org&gt;
    /// License: MIT license &lt;http://www.opensource.org/licenses/mit-license.php&gt;
    /// Project homepage: &lt;http://blixt.googlecode.com/&gt;
    /// </remarks>
    public class GpsLocation
    {
        private double latitude, longitude;

        public const double EarthRadius = 6371.0072; // Kilometers
        //public const double EarthRadius = 3958.76; // Miles

        public double Latitude
        {
            get { return latitude; }
            set { latitude = value; }
        }

        public double Longitude
        {
            get { return longitude; }
            set { longitude = value; }
        }

        public GpsLocation(double latitude, double longitude)
        {
            Latitude = latitude;
            Longitude = longitude;
        }

        public double DistanceTo(GpsLocation other)
        {
            const double dtr = Math.PI / 180;
            double latA = this.Latitude * dtr;
            double lonA = this.Longitude * dtr;
            double latB = other.Latitude * dtr;
            double lonB = other.Longitude * dtr;

            return GpsLocation.EarthRadius * Math.Acos(Math.Cos(latA) * Math.Cos(latB) * Math.Cos(lonB - lonA) + Math.Sin(latA) * Math.Sin(latB));
        }

        public override string ToString()
        {
            return String.Format("({0}, {1})", Latitude, Longitude);
        }
    }
}
