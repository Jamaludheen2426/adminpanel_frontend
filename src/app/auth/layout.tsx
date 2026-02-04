'use client';

import React from 'react';
import { DynamicHead } from "@/components/providers/dynamic-head";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DynamicHead />
      {children}
    </>
  );
}
