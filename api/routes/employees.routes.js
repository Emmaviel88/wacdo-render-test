const express = require('express');
const { createEmployee, loginEmployee, editEmployee, deleteEmployee, listEmployees } = require('../controllers/employees.controller');
const auth = require('../middlewares/auth');
const router = express.Router();

/**
 * @swagger
 * tags:
 *      name: Employees
 *      description: Gestion des employés
 */

// Route de création d'un nouvel employé
// Cette route est protégée par le middleware d'authentification qui vérifie que l'utilisateur est connecté et a le rôle d'administrateur 
// avant de lui permettre de créer un nouvel employé (voir le middleware auth.js pour plus de détails)   
/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Création d'un nouvel employé (Seul un administrateur peut créer un nouvel employé)
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               login:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: ['ADMIN', 'RECEPTION', 'PREPARATION', 'DELIVERY', 'IDLE']
 *     responses:
 *       201:
 *         description: Création réussie, retourne un objet avec les données du nouvel employé créé (sans afficher le mot de passe !)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Employé créé avec succès
 *                 login:
 *                   type: string
 *                   example: jDupont
 *                 password:
 *                   type: string
 *                   example: "**********"
 *                 role:
 *                   type: string
 *                   enum: ['ADMIN', 'RECEPTION', 'PREPARATION', 'DELIVERY', 'IDLE']
 *                   example: PREPARATION
 *       400:
 *         description: Requête invalide, login, mot de passe ou rôle manquant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Veuillez fournir un login, un mot de passe et un rôle pour créer un employé
 *       401:
 *         description: Requête invalide, aucun utilisateur connecté ou token d'authentification manquant ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: veuillez vous connecter avant de pouvoir créer un employé
 *       403:
 *         description: Accès refusé à l'utilsateur actuellement connecté
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: l'utilisateur connecté n'est pas autorisé à créer un employé (réservé au rôle ADMIN)
 *       409:
 *         description: Requête invalide, l'employé existe déjà ou données manquantes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cet employé existe déjà, création impossible !
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erreur serveur lors de la création de l'employé
 *
*/
router.post('/', auth, createEmployee);

// Route de login d'un employé
/**
 * @swagger
 * /api/employees/login:
 *   post:
 *     summary: Authentification d'un employé
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               login:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Authentification réussie, retourne un token JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Employé créé avec succès
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR...
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-06-30T12:00:00.000Z
 *       400:
 *         description: Requête invalide, login ou mot de passe manquant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Veuillez fournir un login et un mot de passe
 *       404:
 *         description: Employé non trouvé
 *         content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  example: Employé non trouvé
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Employé non trouvé
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erreur lors de la connexion
 *                 error:
 *                  type: string
 */
router.post('/login', loginEmployee);

// Route de modification d'un employé (protégée par le middleware d'authentification)

/**
 * @swagger
 * /api/employees/edit/{id}:
 *   put:
 *     summary: Modification d'un employé (Seul un administrateur ou l'employé titulaire du compte lui-même peut modifier les données d'un employé; Un employé ne peut pas modifier son propre rôle, seul un administrateur peut le faire !)
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'employé à modifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               login:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: ['ADMIN', 'RECEPTION', 'PREPARATION', 'DELIVERY', 'IDLE']
 *     responses:
 *       200:
 *         description: Modification réussie, retourne un objet avec les données de l'employé modifié
 *       500:
 *         description: Erreur serveur
 *
*/
router.put('/edit/:id', auth, editEmployee);

// Route de suppression d'un employé (protégée par le middleware d'authentification)
/**
 * @swagger
 * /api/employees/delete/{id}:
 *   delete:
 *     summary: Suppression d'un employé (Seul un administrateur peut supprimer un employé)
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'employé à supprimer
 *     responses:
 *       200:
 *         description: Suppression réussie
 *       500:
 *         description: Erreur serveur
 *
*/
router.delete('/delete/:id', auth, deleteEmployee);

// Route de liste des employés 
/**
 * @swagger
 * /api/employees/list:
 *   get:
 *     summary: Récupération de la liste des employés (sauf les mots de passe !)
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: Récupération réussie, retourne un tableau d'objets avec les données des employés (sans les mots de passe !)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                type: object
 *                properties:
 *                  _id:
 *                    type: string
 *                  login:
 *                    type: string
 *                  role:
 *                    type: string
 *       500:
 *         description: Erreur serveur
 *
*/
router.get('/list', listEmployees);

module .exports = router;