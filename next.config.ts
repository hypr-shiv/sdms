import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/register',
        destination: '/login', // Will be handled client-side if we need mode=signup
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/grades',
        destination: '/dashboard/grades',
        permanent: true,
      },
      {
        source: '/courses',
        destination: '/dashboard/courses',
        permanent: true,
      },
      {
        source: '/finance',
        destination: '/dashboard/fees',
        permanent: true,
      },
      {
        source: '/fees',
        destination: '/dashboard/fees',
        permanent: true,
      },
      {
        source: '/payment',
        destination: '/dashboard/fees',
        permanent: true,
      },
      {
        source: '/payments',
        destination: '/dashboard/fees',
        permanent: true,
      },
      {
        source: '/dashboard/payment',
        destination: '/dashboard/fees',
        permanent: true,
      },
      {
        source: '/dashboard/payments',
        destination: '/dashboard/fees',
        permanent: true,
      },
      {
        source: '/settings',
        destination: '/dashboard/settings',
        permanent: true,
      },
      {
        source: '/student',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/teacher',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
