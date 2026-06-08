// const connectDB = require('../config/db');
const mongoose = require('mongoose');
const Employee = require('../models/employee.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Creation nouvel employé
exports.createEmployee = async (req, res) => {
    try {

        const connectedUser = req.user; // Récupère les informations de l'utilisateur connecté à partir du middleware d'authentification
        if (!connectedUser) {
            return res.status(401).json({ message: 'Requête invalide, veuillez vous connecter avant de pouvoir créer un employé' });
        }
        console.log(`employees.controller-L15 : Utilisateur connecté dans CreateEmployee : ${connectedUser.id} - ${connectedUser.login} (${connectedUser.role})`);

        // Vérifie que l'utilisateur connecté a le rôle d'administrateur
        if (connectedUser.role.toUpperCase() !== 'ADMIN') {
            return res.status(403).json({ message: 'Accès refusé, vous n\'êtes pas autorisé à créer un employé' });
        }
        // Récupère (déserialize) les données du corps de la requête
        const { login, password, role } = req.body;

        // Vérifie que le login, mot de passe et rôle sont présents
        if (!login || !password || !role) {
            return res.status(400).json({ message: 'Veuillez fournir un login, un mot de passe et un rôle pour créer un employé' });
        }
        // Vérifie si l'employé à créer existe déjà en BDD
        const existingEmployee = await Employee.findOne({ login });
        if (existingEmployee) {
            return res.status(409).json({ message: 'L\'employé existe déjà, création impossible !' });
        }
        
        // Évolutions ultérieures : 
        // Ajouter une validation plus poussée des données (complexité du mot de passe)   
        // Utiliser la lib password-validator
        /*
            Exemple d'utilisation de password-validator pour valider la complexité du mot de passe :

            const PasswordValidator = require('password-validator');

            const schema = new PasswordValidator();

            schema
            .is().min(8)          // au moins 8 caractères
            .is().max(100)        // au plus 100 caractères
            .has().uppercase()    // au moins une majuscule
            .has().lowercase()    // au moins une minuscule
            .has().digits(1)      // au moins un chiffre
            .has().not().spaces();// ne contient pas d'espaces

            console.log(schema.validate('Azerty123')); // resultat affiché => true
            console.log(schema.validate('azerty'));    // resultat affiché => false
        */

        /* Autre évolution pour éviter les attaques de type brute-force sur la route de login : 
            Ajouter une limitation des requêtes dans un interval de temps pour éviter les attaques de type brute-force 
            (ex: limiter à 5 tentatives de connexion infructueuses par heure pour un même login) en utilisant la lib express-rate-limit
                const rateLimit = require('express-rate-limit');
                const loginLimiter = rateLimit({
                    windowMs: 60 * 60 * 1000, // 1 heure
                    max: 5, // Limite à 5 requêtes par windowMs
                    message: 'Trop de tentatives de connexion, veuillez réessayer dans une heure'
                });
                app.post('/api/employees/login', loginLimiter, employeesController.loginEmployee);
        */

        // Hash le mot de passe saisi pour ne pas l'envoyer en clair dans la BDD
        const hashedPassword = await bcrypt.hash(password, 10);

        // Instancie un nouvel employé avec les données fournies (le role par défaut est 'IDLE')
        const newEmployee = new Employee({
            login: login,               // La validité du login pourrait être améliorée ultérieurement (ex: regex pour n'autoriser que certains caractères)
            password: hashedPassword,   // Le mot de passe est stocké sous forme de hash pour des raisons de sécurité
            role: role.toUpperCase()    // Le rôle est stocké en majuscules pour uniformiser et faciliter les comparaisons ultérieures (ex: 'ADMIN', 'RECEPTION', 'PREPARATION', 'DELIVERY', 'IDLE')
        });

        // Sauvegarde le nouvel employé en BDD
        const savedEmployee = await newEmployee.save();
        console.log(`employees.controller-L64 : Nouvel employé créé : ${savedEmployee.login} - avec le role : ${savedEmployee.role} et l'ID : ${savedEmployee._id} - Créé par : ${connectedUser.id} (${connectedUser.role})`);

        res.status(201).json({ message: 'Employé créé avec succès', login: savedEmployee.login, password: '**********', role: savedEmployee.role });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la création de l\'employé', error });
    }
};

// Log-in in d'un employé
exports.loginEmployee = async (req, res) => {
    try {
        const { login, password } = req.body;
        // Vérifie que le login et mot de passe sont présents
        if (!login || !password) {
            return res.status(400).json({ message: 'employees.controller-L78 : Veuillez fournir un login et un mot de passe' });
        }
        // Cherche l'employé par son login dans la BDD
        const existingEmployee = await Employee.findOne({ login });
        if (!existingEmployee) {
            return res.status(404).json({ message: 'employees.controller-L83 : Employé non trouvé' });
        }
        const isPwdOk = await bcrypt.compare(password, existingEmployee.password);
        if (!isPwdOk) {
            return res.status(400).json({ message: 'employees.controller-L87 : Login ou mot de passe incorrect' });
        }
        // Génère un token JWT (qui sera utilisé pour authentifier les requêtes ultérieures de l'employé connecté) avec comme payload l'id, le login et le rôle de l'employé, et une durée de validité de 24h
        const token = jwt.sign({ id: existingEmployee._id, login: existingEmployee.login, role: existingEmployee.role.toUpperCase() }, process.env.JWT_SECRET, { expiresIn: '24h' });
        const expiracyDate = new Date(jwt.decode(token).exp * 1000); // Convertit la date d'expiration du token en millisecondes

        console.log(`employees.controller-L91 : L'employé ${existingEmployee.login.toUpperCase()} avec le rôle ${existingEmployee.role} est connecté avec succès !`);
        console.log(`employees.controller-L92 : JWT généré : ${token}`);
        res.status(200).json({ message: 'Connexion réussie', token, expiresAt: expiracyDate });
    } catch (error) {
        console.error(error);

        res.status(500).json({ message: 'Erreur lors de la connexion', error });
    }
};

// Modification d'un employé
exports.editEmployee = async (req, res) => {
    try {
        const connectedUser = req.user;
        console.log(`Utilisateur connecté dans EditEmployee : ${connectedUser.id} - ${connectedUser.login} (${connectedUser.role})`);
        console.log(`ID de l'employé à modifier : ${req.params.id}`);

        // Vérifie que l'utilisateur connecté a le rôle d'administrateur ou que c'est l'utilsateur titulaire du compte lui-même
        if (connectedUser.id !== req.params.id && connectedUser.role.toUpperCase() !== 'ADMIN') {
            return res.status(403).json({ message: 'L13 : Accès refusé, vous n\'êtes pas autorisé à modifier ces données' });
        }
        const { id } = req.params;
        const { login, password, role } = req.body;
        // Vérifie si l'employé à modifier existe
        const existingEmployee = await Employee.findById(id);
        if (!existingEmployee) {
            return res.status(404).json({ message: 'Employé non trouvé, modification impossible !' });
        }
        // Hash le nouveau mot de passe saisi
        const hashedPassword = await bcrypt.hash(password, 10);
        // Met à jour les données de l'employé
        existingEmployee.login = login;
        existingEmployee.password = hashedPassword;
        // Le rôle ne peut être modifié que par un administrateur, sinon il reste inchangé
        if (connectedUser.role.toUpperCase() == 'ADMIN') {
            existingEmployee.role = role.toUpperCase();
        }
        if(existingEmployee.role.toUpperCase() !== role.toUpperCase() && connectedUser.role.toUpperCase() !== 'ADMIN') {
            console.log(`L'utilisateur ${connectedUser.login} (${connectedUser.role}) a tenté de modifier le rôle de l'employé ${existingEmployee.login} (${existingEmployee.role}) sans les permissions nécessaires, le rôle reste inchangé`);
            res.status(403).json({ message: 'L106 : Accès refusé, vous n\'êtes pas autorisé à modifier le rôle. Seul un ADMINISTRATEUR peut le faire !' });
        }

        // Met à jour les modifications en BDD
        const retval = await Employee.updateOne({ _id: id }, existingEmployee, { new: true });
        if (!retval.acknowledged || retval.modifiedCount === 0) {
            return res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'employé', error });
        }
        // Récupère les données de l'employé mis à jour pour les retourner dans la réponse
        const afterUpdateEmployee = await Employee.findById(id); // Récupère les données de l'employé mis à jour pour les retourner dans la réponse
        console.log(`Employé modifié : ${afterUpdateEmployee.login} - avec le role : ${afterUpdateEmployee.role} et l'ID : ${afterUpdateEmployee._id} - Modifié par : ${connectedUser.id} (${connectedUser.role})`);
        res.status(200).json({ afterUpdateEmployee });
    } catch (error) {
        res.status(500).json({ message: 'L105 Erreur lors de la modification de l\'employé', error });
    }
};

exports.deleteEmployee = async (req, res) => {
    try {
        const connectedUser = req.user;
        console.log(`Utilisateur connecté dans DeleteEmployee : ${connectedUser.id} - ${connectedUser.login} (${connectedUser.role})`);
        
        // Vérifie que l'utilisateur connecté a le rôle d'administrateur
        if (connectedUser.role.toUpperCase() !== 'ADMIN') {
            return res.status(403).json({ message: 'L116 : Accès refusé, vous n\'êtes pas autorisé à supprimer un employé' });
        }
        const { id } = req.params;
        // Vérifie si l'employé à supprimer existe
        const existingEmployee = await Employee.findById(id);
        if (!existingEmployee) {
            return res.status(404).json({ message: 'Employé non trouvé, suppression impossible !' });
        }
        // Supprime l'employé de la BDD
        await existingEmployee.deleteOne({ _id: id });
        console.log(`Employé supprimé : ${existingEmployee.login} - avec le role : ${existingEmployee.role} et l'ID : ${existingEmployee._id} - Supprimé par : ${connectedUser.id} (${connectedUser.role})`);
        res.status(200).json({ message: 'Employé supprimé avec succès' });

    } catch (error) {
        res.status(500).json({ message: 'L130 Erreur lors de la suppression de l\'employé', error: error.message });
    }
};

exports.listEmployees = async (req, res) => {
    try {
        const employees = await Employee.find().select('-password'); // Exclut le champ password de la liste des employés
        console.log(`Liste des employés récupérée, contient ${employees.length} employés`);
        res.status(200).json({ employees });
    } 
    catch (error) {
        res.status(500).json({ message: 'L139 Erreur lors de la récupération de la liste des employés', error });
    };
   
};