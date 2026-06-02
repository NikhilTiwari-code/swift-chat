import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { logger } from "../config/logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // ── Zod validation errors (400) ──────────────────────────────
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      errors: err.errors.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  // ── Prisma known request errors ───────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.warn({ code: err.code, meta: err.meta, path: req.path }, "Prisma known error");

    // P2002 = unique constraint violation
    if (err.code === "P2002") {
      const fields = (err.meta?.target as string[])?.join(", ") ?? "field";
      return res.status(409).json({ message: `${fields} already exists` });
    }

    // P2025 = record not found (e.g. update/delete on missing row)
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Record not found" });
    }

    // P2003 = foreign key constraint failed
    if (err.code === "P2003") {
      return res.status(400).json({ message: "Related record not found" });
    }

    return res.status(400).json({ message: `Database error: ${err.code}` });
  }

  // ── Prisma validation errors (bad query shape) ────────────────
  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.error({ err, path: req.path }, "Prisma validation error");
    return res.status(400).json({ message: "Invalid request data" });
  }

  // ── Prisma initialization / connection errors (503) ──────────
  if (
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientRustPanicError
  ) {
    logger.error({ err, path: req.path }, "Database connection error");
    return res.status(503).json({
      message: "Database unavailable — please try again shortly"
    });
  }

  // ── App-level errors with explicit status ─────────────────────
  const status = (err as any).status ?? 500;
  const message = err.message || "Internal Server Error";

  if (status >= 500) {
    // Log full error details for server errors (never expose stack to client)
    logger.error(
      { err, method: req.method, path: req.path, status },
      "Unhandled server error"
    );
  }

  res.status(status).json({ message });
};
