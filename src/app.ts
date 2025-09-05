import express, { Request, Response, Express } from "express";

/**
 * Interface representing a customer.
 */
interface Customer {
    id: number;
    name: string;
    status: "GOLD" | "SILVER" | "BRONZE" | "PLATINUM"; // Added PLATINUM
    points: number;
    lastPurchaseDate: string;
    email?: string;
    preferredStore?: string;
    joinDate: string;
    notifications: boolean;
    lastStatusChange?: string;
}

const customers: Customer[] = [
    {
        id: 1,
        name: "John Smith",
        status: "SILVER",
        points: 450,
        lastPurchaseDate: "2024-02-15",
        joinDate: "2023-06-15",
        notifications: true,
        preferredStore: "Downtown",
    },
    {
        id: 2,
        name: "Jane Doe",
        status: "GOLD",
        points: 850,
        lastPurchaseDate: "2024-03-01",
        email: "jane.doe@email.com",
        joinDate: "2023-01-20",
        notifications: false,
    },
    {
        id: 3,
        name: "Alice Brown",
        status: "PLATINUM",
        points: 1200,
        lastPurchaseDate: "2024-03-10",
        joinDate: "2023-02-01",
        notifications: true,
    },
];

const app: Express = express();
app.use(express.json());

/**
 * Retrieve a customer by ID.
 * @route GET /api/customers/:id
 */
app.get("/api/customers/:id", (req: Request, res: Response): void => {
    const customerId: number = parseInt(req.params.id);
    const customer: Customer | undefined = customers.find(c => c.id === customerId);
    if (customer) {
        res.json(customer);
    } else {
        res.status(404).send("Customer not found");
    }
});

/**
 * Record a purchase for a customer and update status based on points.
 * @route POST /api/customers/:id/purchase
 */
app.post("/api/customers/:id/purchase", (req: Request, res: Response): void => {
    const customerId: number = parseInt(req.params.id);
    const customer: Customer | undefined = customers.find(c => c.id === customerId);
    if (!customer) {
        res.status(404).send("Customer not found");
        return;
    }

    const purchaseAmount: number = req.body.amount;
    const storeLocation: string = req.body.storeLocation;

    // Base points
    let pointsToAdd = Math.floor(purchaseAmount / 10);

    // Apply status multiplier
    if (customer.status === "GOLD") pointsToAdd = Math.floor(pointsToAdd * 1.2);
    if (customer.status === "PLATINUM") pointsToAdd = Math.floor(pointsToAdd * 2);

    // Add points
    customer.points += pointsToAdd;
    customer.lastPurchaseDate = new Date().toISOString();

    // Update status based on points
    const now = new Date();
    const lastChange = customer.lastStatusChange ? new Date(customer.lastStatusChange) : null;

    if (customer.points >= 1000) {
        customer.status = "PLATINUM";
        customer.lastStatusChange = now.toISOString();
    } else if (customer.points >= 750) {
        // Keep existing GOLD for 30 days
        if (customer.status !== "GOLD" || !lastChange || (now.getTime() - lastChange.getTime()) > 30*24*60*60*1000) {
            customer.status = "GOLD";
            customer.lastStatusChange = now.toISOString();
        }
    } else if (customer.points >= 500) {
        customer.status = "SILVER";
        customer.lastStatusChange = now.toISOString();
    } else {
        customer.status = "BRONZE";
        customer.lastStatusChange = now.toISOString();
    }

    res.json(customer);
});

/**
 * Update customer preferences.
 * @route PATCH /api/customers/:id/preferences
 */
app.patch("/api/customers/:id/preferences", (req: Request, res: Response): void => {
    const customerId: number = parseInt(req.params.id);
    const customer: Customer | undefined = customers.find(c => c.id === customerId);
    if (!customer) {
        res.status(404).send("Customer not found");
        return;
    }

    if (typeof req.body.notifications === "boolean") customer.notifications = req.body.notifications;
    if (typeof req.body.preferredStore === "string") customer.preferredStore = req.body.preferredStore;
    if (typeof req.body.email === "string") customer.email = req.body.email;

    res.json(customer);
});

export default app;

/**
 * Analytics endpoint (Ticket 6):
 * Returns total customers, average points, and status distribution.
 * @route GET /api/analytics
 */
app.get("/api/analytics", (req: Request, res: Response): void => {
    const totalCustomers = customers.length;
    const totalPoints = customers.reduce((sum, c) => sum + c.points, 0);
    const avgPoints = totalCustomers > 0 ? totalPoints / totalCustomers : 0;

    const statusDistribution: Record<Customer["status"], number> = {
        PLATINUM: 0,
        GOLD: 0,
        SILVER: 0,
        BRONZE: 0,
    };

    customers.forEach((c) => {
        statusDistribution[c.status]++;
    });

    res.json({
        totalCustomers,
        averagePoints: avgPoints,
        statusDistribution,
    });
});