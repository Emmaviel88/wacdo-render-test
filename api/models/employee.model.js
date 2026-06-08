const mongoose = require('mongoose');

/*
Évolution possible : 
Ajouter un champ supplémentaire comme lastChangeDate pour gérer l'obsolescence du mot de passe.
Lors de la création de l'employé, initialiser lastChangeDate à la date actuelle.
Lors de la connexion, vérifier si lastChangeDate est supérieur à une certaine durée (ex : 90 jours). Si oui, forcer l'employé à changer son mot de passe.
*/

const employeeSchema = new mongoose.Schema({
    login: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'RECEPTION', 'PREPARATION', 'DELIVERY', 'IDLE']},
}, { timestamps: true });

module.exports = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);