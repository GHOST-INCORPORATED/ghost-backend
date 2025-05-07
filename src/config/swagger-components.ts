/**
 * @openapi
 * components:
 *   schemas:
 *     CreateEscrowRequest:
 *       type: object
 *       required:
 *         - sellerId
 *         - amount
 *         - description
 *       properties:
 *         sellerId:
 *           type: string
 *           description: ID of the seller
 *         amount:
 *           type: number
 *           description: Amount in cents
 *         description:
 *           type: string
 *           description: Escrow description
 *
 *     Escrow:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         buyerId:
 *           type: string
 *         sellerId:
 *           type: string
 *         amount:
 *           type: number
 *         description:
 *           type: string
 *         status:
 *           $ref: '#/components/schemas/EscrowStatus'
 *
 *     EscrowStatus:
 *       type: string
 *       enum:
 *         - AWAITING_PAYMENT
 *         - AWAITING_FEEDBACK
 *         - BUYER_CONFIRMED
 *         - RELEASED
 *
 *     ProcessWithdrawalRequest:
 *       type: object
 *       required:
 *         - escrowId
 *       properties:
 *         escrowId:
 *           type: string
 *           description: ID of the escrow to withdraw from
 */
export {}; // no JS export needed – swagger-jsdoc reads comments :contentReference[oaicite:1]{index=1}
