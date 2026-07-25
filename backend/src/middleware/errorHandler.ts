import type { Request, Response, NextFunction } from "express";

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Error: ", err.message);

    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}

// if the status code is 200 and an error is thrown, we set the status code to 500 (Internal Server Error) to indicate that something went wrong on the server side.
