import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");

  const headersList = await headers();
  const apiKey = headersList.get("x-api-key");

  // Only support Anthropic validation for now
  if (provider !== "anthropic") {
    return NextResponse.json(
      { error: "Only Anthropic provider is supported" },
      { status: 400 }
    );
  }

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    });

    if (response.status === 401) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to validate API key" },
        { status: 500 }
      );
    }

    return NextResponse.json({ isValid: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Network error during validation" },
      { status: 500 }
    );
  }
};
