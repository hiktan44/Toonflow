export interface ApiResponse {
 code: number;
 data: any;
 message: string;
}

// Successcallback
export function success<T>(data: T | null = null, message: string = "Success"): ApiResponse {
 return {
 code: 200,
 data,
 message,
 };
}

// clientErrorresponse
export function error<T>(message: string = "", data: T | null = null): ApiResponse {
 return {
 code: 400,
 data,
 message,
 };
}
