import type { Request, Response, NextFunction } from "express";

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Error: ", err.message);

    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const isDevelopment = process.env.NODE_ENV === 'development';

    console.error(`[Error Handler] Status: ${statusCode} | Message: ${err.message}`);
    if (err.stack) {
        console.error(err.stack);
    }
    res.status(statusCode).json({
        message: isDevelopment
            ? (err.message || "Internal Server Error")
            : (statusCode >= 500 ? "Internal Server Error" : err.message || "Bad Request"),

        ...(isDevelopment && { stack: err.stack })
    });
}

// if the status code is 200 and an error is thrown, we set the status code to 500 (Internal Server Error) to indicate that something went wrong on the server side.
