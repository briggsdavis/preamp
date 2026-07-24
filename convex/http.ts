import { httpRouter } from "convex/server"
import { auth } from "./auth"

/**
 * HTTP routes for the Convex backend.
 *
 * Convex Auth registers its required routes (e.g. OAuth callbacks) here.
 * Add your own custom HTTP endpoints to this router as needed.
 *
 * Docs: https://docs.convex.dev/functions/http-actions
 */
const http = httpRouter()

auth.addHttpRoutes(http)

export default http
