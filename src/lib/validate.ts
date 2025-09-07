import { ZodSchema } from "zod";
import { NextRequest, NextResponse } from "next/server";

export function validateBody<T>(schema: ZodSchema<T>) {
  return async (req: NextRequest) => {
    try {
      const body = await req.json();
      const result = schema.safeParse(body);
      
      if (!result.success) {
        return NextResponse.json(
          { 
            error: "Validation failed", 
            details: result.error.flatten() 
          }, 
          { status: 400 }
        );
      }
      
      return result.data;
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON" }, 
        { status: 400 }
      );
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>, params: Record<string, string>) {
  const result = schema.safeParse(params);
  
  if (!result.success) {
    return {
      error: NextResponse.json(
        { 
          error: "Invalid parameters", 
          details: result.error.flatten() 
        }, 
        { status: 400 }
      )
    };
  }
  
  return { data: result.data };
}

export function validateQuery<T>(schema: ZodSchema<T>, searchParams: URLSearchParams) {
  const queryObject = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(queryObject);
  
  if (!result.success) {
    return {
      error: NextResponse.json(
        { 
          error: "Invalid query parameters", 
          details: result.error.flatten() 
        }, 
        { status: 400 }
      )
    };
  }
  
  return { data: result.data };
}