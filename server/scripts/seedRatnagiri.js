import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import Alert from "../src/models/Alert.js";
import Checkin from "../src/models/Checkin.js";
import Connection from "../src/models/Connection.js";
import Experience from "../src/models/Experience.js";
import Otp from "../src/models/Otp.js";
import Opportunity from "../src/models/Opportunity.js";
import SignupSession from "../src/models/SignupSession.js";
import User from "../src/models/User.js";
import WorkerRating from "../src/models/WorkerRating.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const password = "EmpowHer@123";

const users = [
    {
        name: "Aarohi Sawant",
        phone: "9000001001",
        email: "aarohi.ratnagiri@example.com",
        role: "woman",
        gender: "female",
        profession: "Teacher",
        maritalStatus: "married",
        locality: "Ratnagiri",
        latitude: 16.9902,
        longitude: 73.3120,
        identityVerified: true,
        identityVerifiedAt: new Date()
    },
    {
        name: "Meera Kadam",
        phone: "9000001002",
        email: "meera.ratnagiri@example.com",
        role: "woman",
        gender: "female",
        profession: "Homemaker",
        maritalStatus: "married",
        locality: "Ratnagiri",
        latitude: 16.9958,
        longitude: 73.3006,
        identityVerified: true,
        identityVerifiedAt: new Date()
    },
    {
        name: "Nisha Patil",
        phone: "9000001003",
        email: "nisha.ratnagiri@example.com",
        role: "woman",
        gender: "female",
        profession: "Student",
        maritalStatus: "single",
        locality: "Ratnagiri",
        latitude: 16.9829,
        longitude: 73.3147,
        identityVerified: true,
        identityVerifiedAt: new Date()
    },
    {
        name: "Pooja Jadhav",
        phone: "9000001004",
        email: "pooja.chiplun@example.com",
        role: "woman",
        gender: "female",
        profession: "Nurse",
        maritalStatus: "single",
        locality: "Chiplun",
        latitude: 17.5334,
        longitude: 73.5178,
        identityVerified: true,
        identityVerifiedAt: new Date()
    },
    {
        name: "Sakshi Pawar",
        phone: "9000001005",
        email: "sakshi.chiplun@example.com",
        role: "woman",
        gender: "female",
        profession: "Tailor",
        maritalStatus: "prefer_not_to_say",
        locality: "Chiplun",
        latitude: 17.5291,
        longitude: 73.5224,
        identityVerified: true,
        identityVerifiedAt: new Date()
    },
    {
        name: "Sanjay Shinde",
        phone: "9000002001",
        email: "sanjay.driver@example.com",
        role: "worker",
        gender: "male",
        workType: "Auto driver",
        profession: "Auto driver",
        locality: "Ratnagiri",
        latitude: 16.9933,
        longitude: 73.3079,
        idVerified: true
    },
    {
        name: "Prakash More",
        phone: "9000002002",
        email: "prakash.electrician@example.com",
        role: "worker",
        gender: "male",
        workType: "Electrician",
        profession: "Electrician",
        locality: "Ratnagiri",
        latitude: 16.9874,
        longitude: 73.3017,
        idVerified: true
    },
    {
        name: "Farida Shaikh",
        phone: "9000002003",
        email: "farida.tailor@example.com",
        role: "worker",
        gender: "female",
        workType: "Tailor",
        profession: "Tailor",
        locality: "Ratnagiri",
        latitude: 16.9966,
        longitude: 73.3138,
        idVerified: true
    },
    {
        name: "Ramesh Naik",
        phone: "9000002004",
        email: "ramesh.plumber@example.com",
        role: "worker",
        gender: "male",
        workType: "Plumber",
        profession: "Plumber",
        locality: "Ratnagiri",
        latitude: 16.9841,
        longitude: 73.3091
    },
    {
        name: "Vivek Gawde",
        phone: "9000002005",
        email: "vivek.chiplun@example.com",
        role: "worker",
        gender: "male",
        workType: "Tutor",
        profession: "Tutor",
        locality: "Chiplun",
        latitude: 17.5312,
        longitude: 73.5199,
        idVerified: true
    }
];

const experiences = [
    {
        title: "Well-lit route near Maruti Mandir",
        content: "The Maruti Mandir main stretch stayed busy until late evening. Shops were open and two trusted autos waited near the junction.",
        category: "positive_experience",
        sharedBy: "aarohi.ratnagiri@example.com"
    },
    {
        title: "Prefer the market road after 8 PM",
        content: "For walks from ST Stand toward the bazaar, the market road has more people and better lighting than the quieter inner lane.",
        category: "safety_tip",
        sharedBy: "meera.ratnagiri@example.com"
    },
    {
        title: "Patchy lighting near beach approach",
        content: "A few lamps near the Mandavi beach approach were not working this week. Share live location or travel with someone after dark.",
        category: "warning",
        sharedBy: "nisha.ratnagiri@example.com"
    },
    {
        title: "Busy clinic lane in Chiplun",
        content: "The clinic lane had steady footfall around 7 PM and pharmacies stayed open, so it felt safer than the back road.",
        category: "positive_experience",
        sharedBy: "pooja.chiplun@example.com"
    }
];

const alerts = [
    {
        type: "unsafe_area",
        description: "Streetlights are out near the Mandavi beach approach after the last row of shops.",
        latitude: 16.9845,
        longitude: 73.2878,
        raisedBy: "aarohi.ratnagiri@example.com"
    },
    {
        type: "suspicious_activity",
        description: "Repeated loitering reported near the quieter lane behind the bus stand in the evening.",
        latitude: 16.9913,
        longitude: 73.3068,
        raisedBy: "meera.ratnagiri@example.com"
    },
    {
        type: "other",
        description: "Road repair near the Chiplun market is narrowing the walking path this week.",
        latitude: 17.5329,
        longitude: 73.5195,
        raisedBy: "pooja.chiplun@example.com"
    }
];

const opportunities = [
    {
        title: "Babysitting needed for Saturday evening",
        description: "Need a verified local helper for 3 hours while attending a community meeting. Experience with toddlers preferred.",
        category: "babysitting",
        pay: "Rs. 600 for 3 hours",
        postedBy: "aarohi.ratnagiri@example.com"
    },
    {
        title: "Math tutor for class 8",
        description: "Looking for two evening sessions per week near Maruti Mandir. Patient teaching style preferred.",
        category: "teaching",
        pay: "Rs. 350 per session",
        postedBy: "meera.ratnagiri@example.com"
    },
    {
        title: "Pick up medicines from market",
        description: "One-time errand from the main market pharmacy to Mandavi area before 6 PM.",
        category: "errand",
        pay: "Rs. 180",
        postedBy: "nisha.ratnagiri@example.com"
    },
    {
        title: "Blouse alteration help",
        description: "Need simple alteration support this week near Chiplun market.",
        category: "custom",
        pay: "Rs. 250",
        postedBy: "sakshi.chiplun@example.com"
    }
];

const ratingPlan = [
    ["sanjay.driver@example.com", "aarohi.ratnagiri@example.com", 5],
    ["sanjay.driver@example.com", "meera.ratnagiri@example.com", 5],
    ["sanjay.driver@example.com", "nisha.ratnagiri@example.com", 4],
    ["prakash.electrician@example.com", "aarohi.ratnagiri@example.com", 5],
    ["prakash.electrician@example.com", "meera.ratnagiri@example.com", 4],
    ["farida.tailor@example.com", "aarohi.ratnagiri@example.com", 5],
    ["farida.tailor@example.com", "nisha.ratnagiri@example.com", 5],
    ["ramesh.plumber@example.com", "meera.ratnagiri@example.com", 4]
];

const connectionPlan = [
    ["aarohi.ratnagiri@example.com", "meera.ratnagiri@example.com"],
    ["aarohi.ratnagiri@example.com", "nisha.ratnagiri@example.com"]
];

async function upsertUser(user, passwordHash) {
    return User.findOneAndUpdate(
        { email: user.email },
        {
            $set: {
                ...user,
                passwordHash,
                safetyRating: user.safetyRating || 0,
                ratingCount: user.ratingCount || 0
            }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
}

async function recomputeWorkerRating(workerId) {
    const summary = await WorkerRating.aggregate([
        { $match: { worker: workerId } },
        {
            $group: {
                _id: "$worker",
                ratingCount: { $sum: 1 },
                safetyRating: { $avg: "$rating" }
            }
        }
    ]);

    await User.findByIdAndUpdate(workerId, {
        ratingCount: summary[0]?.ratingCount || 0,
        safetyRating: Number((summary[0]?.safetyRating || 0).toFixed(1))
    });
}

async function seed() {
    if(!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is missing in server/.env");
    }

    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    await Promise.all([
        Alert.deleteMany({}),
        Checkin.deleteMany({}),
        Connection.deleteMany({}),
        Experience.deleteMany({}),
        Opportunity.deleteMany({}),
        Otp.deleteMany({}),
        SignupSession.deleteMany({}),
        WorkerRating.deleteMany({}),
        User.deleteMany({})
    ]);

    const passwordHash = await bcrypt.hash(password, 12);
    const people = new Map();

    for(const user of users) {
        const saved = await upsertUser(user, passwordHash);
        people.set(saved.email, saved);
    }

    for(const [requesterEmail, recipientEmail] of connectionPlan) {
        await Connection.findOneAndUpdate(
            { requester: people.get(requesterEmail)._id, recipient: people.get(recipientEmail)._id },
            { status: "accepted" },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }

    await User.findByIdAndUpdate(people.get("meera.ratnagiri@example.com")._id, {
        sharingWith: [people.get("aarohi.ratnagiri@example.com")._id],
        sharingExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
    });

    for(const [workerEmail, ratedByEmail, rating] of ratingPlan) {
        await WorkerRating.findOneAndUpdate(
            { worker: people.get(workerEmail)._id, ratedBy: people.get(ratedByEmail)._id },
            { rating },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }

    for(const worker of users.filter((user) => user.role === "worker")) {
        await recomputeWorkerRating(people.get(worker.email)._id);
    }

    for(const item of experiences) {
        const author = people.get(item.sharedBy);
        await Experience.findOneAndUpdate(
            { locality: author.locality, title: item.title },
            {
                ...item,
                locality: author.locality,
                sharedBy: author._id,
                likes: [people.get("aarohi.ratnagiri@example.com")._id, people.get("meera.ratnagiri@example.com")._id]
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }

    for(const item of alerts) {
        const reporter = people.get(item.raisedBy);
        await Alert.findOneAndUpdate(
            { locality: reporter.locality, description: item.description },
            {
                ...item,
                locality: reporter.locality,
                raisedBy: reporter._id,
                status: "active"
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }

    for(const item of opportunities) {
        const poster = people.get(item.postedBy);
        await Opportunity.findOneAndUpdate(
            { locality: poster.locality, title: item.title },
            {
                ...item,
                locality: poster.locality,
                postedBy: poster._id,
                status: "open"
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }

    console.log(`Seeded ${users.length} users, ${experiences.length} experiences, ${alerts.length} alerts, and ${opportunities.length} opportunities.`);
    console.log(`Demo password for all seeded accounts: ${password}`);
    console.log("Try signing in as aarohi.ratnagiri@example.com");
}

seed()
    .catch((error) => {
        console.error("Ratnagiri seed failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
