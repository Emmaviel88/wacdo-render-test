const request = require('supertest');
const { MongoMemoryServer } = require("mongodb-memory-server");
const { default: mongoose } = require('mongoose');
const { testsAdd } = require('../api/middlewares/miscFunctions');

// Création d'un mock pour le middleware d'authentification afin de simuler un utilisateur connecté
jest.mock('../api/middlewares/auth', () => {
    return (req, res, next) => {
        req.user = {
            _id: "69c7fran5da2f6ebf06579d9",
            login: 'admin',
            role: 'ADMIN'
        };
        next();
    };
});

const app = require('../api/index');

// Création DB en mémoire
let mongoServer;

beforeAll(async() => {
    // Définit une variable d'environnement pour le secret JWT utilisé dans les tests
    process.env.JWT_SECRET = 'test-secret';
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {dbName: 'JestTests'});
});

afterAll(async () => {
    await mongoose.disconnect();
    console.log("connexion mongoose fermée")
    await mongoServer.stop();
    console.log("mongoMemoryServer arrêté")
});

// Test d'une fonction simple d'addition de 2 nombres
describe('Test d\'une fonction simple d\'addition avec JEST', () => {
    it('Additionne deux nombres fournis en paramètres', async () => {
        const result = testsAdd(2, 3);
        console.log(`Le résultat de l'addition est : ${result}`);
    expect(result).toBe(5);    

    })
});

describe('POST /api/employees/', () => {
    it('Login de création d\'un employé', async () => {
        const result = await request(app)
            .post("/api/employees")
            .send({
                login: "Employee_07",
                password: "Pwd07",
                role: "IDLE"
            })
            .set('Authorization', 'Bearer mockToken'); // Ajout d'un token d'authentification fictif pour simuler un utilisateur connecté

        expect(result.status).toBe(201);
        expect(result.status).toBe(201);
        expect(result.body.login).toBe('Employee_07');
        expect(result.body.message).toBe('Employé créé avec succès');
        expect(result.body.password).toBe('**********');
        expect(result.body.role).toBe('IDLE');
    })

});

describe('POST /api/employees/login', () => {
    it('Login d\'un employé', async () => {
        const result = await request(app)
            .post("/api/employees/login")
            .send({
                login: "Employee_07",
                password: "Pwd07"
            });
        console.log(result.body);
        expect(result.status).toBe(200);
        expect(result.body).toHaveProperty('token');
    }) 
});   

describe('GET /api/employees/list', () => {
    it('Récupération de la liste des employés', async () => {
        const result = await request(app)
            .get("/api/employees/list")
            .set('Authorization', 'Bearer mockToken'); // Ajout d'un token d'authentification fictif pour simuler un utilisateur connecté
        console.log(result.body);
        expect(result.status).toBe(200);
        expect(result.body).toHaveProperty('employees');
        expect(Array.isArray(result.body.employees)).toBe(true);
    })
});