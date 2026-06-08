const express = require('express');
const { createOrder, updateOrderStatus, getOrdersList, addLineToOrder, getOrderDetails, deleteOrderLine } = require('../controllers/orders.controller');
const auth = require('../middlewares/auth');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Gestion des commandes
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Route de création d'une commande (pour un employé avec le rôle PREPARATION ou ADMIN)
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               placeConsume:
 *                 type: string
 *     responses:
 *       201:
 *         description: Commande créée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 order:
 *                   type: object
 *                   properties:
 *                     empCreated:
 *                       type: string
 *                       format: uuid
 *                       default: Connected UserId
 *                       description: Id du user connecté
 *                     empPrepared:
 *                       type: string
 *                       nullable: true
 *                     empDelivered:
 *                       type: string
 *                       nullable: true
 *                     status:
 *                       type: string
 *                       enum: [PENDING, PREPARING, READY, DELIVERED]
 *                     lines:
 *                      type: array
 *                      default: []
 *                      items:
 *                        type: object
 *                     price:
 *                       type: number
 *                       format: float
 *                       description: initialisé à 0.0
 *       400: 
 *         description: Requête invalide = l'Id de l'employé connecté est requis pour la création de la commande
 *       403:
 *         description: Erreur ! Accès refusé = l'utilisateur doit être connecté avec un rôle PREPARATION ou ADMIN pour créer une commande
 *       404:
 *         description: Erreur ! Employé connecté non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.post('/', auth, createOrder);

/**
 * @swagger
 * /api/orders/updateStatus/{orderId}:
 *   put:
 *     summary: Route de mise à jour du statut de la commande
 *     description: |
 *       Règles d'évolution du statut :
 *       - 'PENDING'-> 'PREPARING'
 *       - 'PREPARING'-> 'READY'
 *       - 'READY'-> 'DELIVERED'
 * 
 *       Rôle : 
 *       L'utilisateur doit être connecté avec un rôle ADMIN, RECEPTION, PREPARATION ou DELIVERY
 * 
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: 
 *                 type: string
 *     responses:
 *       200:
 *         description: Statut de la commande mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 order:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     login:
 *                       type: string
 *                     empCreated:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           format: uuid
 *                           default: Id du user connecté
 *                           description: Id du user connecté lors de la création
 *                         login:
 *                           type: string
 *                           description: Login du user connecté lors de la création 
 *                     empPrepared:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           format: uuid
 *                           default: Id du user connecté
 *                           description: Id du user connecté lors de la préparation
 *                         login:
 *                           type: string
 *                           description: Login du user connecté lors de la préparation 
 *                     empDelivered:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           format: uuid
 *                           default: null
 *                           description: Id du user connecté lors de la création
 *                     status:
 *                       type: string 
 *                       enum: ['PREPARING', 'READY', 'DELIVERED']
 *                       description: le statut courant de la commande
 *                     lines:
 *                       type: array
 *                       items:
 *                        type: object
 *                        properties:
 *                          lineId:
 *                            type: string
 *                          productId:
 *                            type: string
 *                          menuId:
 *                             type: string
 *                          quantity:
 *                             type: integer
 *                     total:
 *                       type: number
 *       500:
 *         description: Erreur serveur             
 */
router.put('/updateStatus/:orderId', auth, updateOrderStatus);

/**
 * @swagger
 * /api/orders/list:
 *   get:
 *     summary: Route d'affichage de la liste des commandes
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Liste détaillée des commandes dans l'ordre de création (FIFO)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   status:
 *                     type: string
 *                   placeConsume:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     description: Date et heure de création 
 *       500: 
 *         description: Erreur serveur
 */
router.get('/list', getOrdersList);

/**
 * @swagger
 * /api/orders/addLineToOrder/{orderId}:
 *   post:
 *     summary: Route d'ajout d'une ligne à une commande
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: 
 *                 type: string
 *                 description: Id du produit à ajouter (si c'est un produit, sinon null)
 *               menuId:
 *                 type: string
 *                 description: Id du menu à ajouter (si c'est un menu, sinon null)
 *               quantityOrdered:
 *                 type: number
 *                 description: Quantité à ajouter à a commande
 *     responses:
 *       200:
 *         description: Ligne de commande ajoutée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string 
 *       400:
 *         description: Erreur ! Au moins un productId ou un menuId requis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Erreur ! Accès refusé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Erreur ! Commande non trouvée ou employé connecté non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500: 
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *  
 */
router.post('/addLineToOrder/:orderId', auth, addLineToOrder);

/**
 * @swagger
 * /api/orders/orderDetails/{orderId}:
 *   get:
 *     summary: Route de récupération des détails d'une commande (Order lines)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste détaillée des lignes d'une commande
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 order:
 *                   type: object
 *                   properties:
 *                     empCreated:
 *                       type: string
 *                       format: uuid
 *                       default: Id du user connecté
 *                       description: Id du user connecté pour la création
 *                     empPrepared:
 *                       type: string
 *                       format: uuid
 *                       default: Id du user connecté
 *                       description: Id du user connecté pour la préparation
 *                     empDelivered:
 *                       type: string
 *                       format: uuid
 *                       default: null
 *                       description: Id du user connecté pour la création
 *                     status:
 *                       type: string
 *                       enum: ['PREPARING', 'READY', 'DELIVERED']
 *                       description: le statut courant de la commande     
 *                     lines:
 *                       type: array
 *                       items:
 *                        type: object
 *                        properties:
 *                          orderId:
 *                            type: string
 *                          productId:
 *                            type: string
 *                          menuId:
 *                             type: string
 *                          quantity:
 *                             type: integer
 *                          price:
 *                             type: number
 *                     price:
 *                       type: number
 *       500: 
 *         description: Erreur serveur
 */
router.get('/orderDetails/:orderId', getOrderDetails);

/**
 * @swagger
 * /api/orders/deleteLineFromOrder/{orderId}:
 *   delete:
 *     summary: Route de suppression d'une ligne de commande (Order line)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderLineId: 
 *                 type: string
 *     responses:
 *       200:
 *         description: Ligne de commande supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string 
 *       400:
 *        description: Erreur ! Une ligne de commande ne peut être supprimée que si la commande est au statut PREPARING ou READY
 *        content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *       404:
 *         description: Erreur ! Ligne de commande à supprimer non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500: 
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.delete('/deleteLineFromOrder/:orderId', auth, deleteOrderLine);

module.exports = router;