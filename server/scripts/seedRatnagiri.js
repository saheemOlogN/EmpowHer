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

const password = "123";

const locations = {
    pin415616: {
        pincode: "415616",
        area: "Ratnagiri",
        district: "Ratnagiri",
        state: "Maharashtra",
        center: { latitude: 16.9902, longitude: 73.3120 }
    },
    pin415605: {
        pincode: "415605",
        area: "Chiplun",
        district: "Ratnagiri",
        state: "Maharashtra",
        center: { latitude: 17.5334, longitude: 73.5178 }
    }
};

const formatLocality = (location) => `${location.area}, ${location.district}, ${location.state} - ${location.pincode}`;

function personLocation(location, latitudeOffset = 0, longitudeOffset = 0) {
    return {
        locality: formatLocality(location),
        location: {
            pincode: location.pincode,
            area: location.area,
            district: location.district,
            state: location.state
        },
        latitude: Number((location.center.latitude + latitudeOffset).toFixed(6)),
        longitude: Number((location.center.longitude + longitudeOffset).toFixed(6))
    };
}

const women415616 = [
    ["Meera Kadam", "9000001001", "meera@gmail.com", "Teacher", "married", 0.0011, 0.0014],
    ["Seher Shaikh", "9000001002", "seher@gmail.com", "Student", "single", -0.0018, 0.0021],
    ["Madiha Khan", "9000001003", "madiha@gmail.com", "Nurse", "single", 0.0022, -0.0011],
    ["Samiya Ansari", "9000001004", "samiya@gmail.com", "Housewife", "married", -0.0025, -0.0018],
    ["Ayesha Parkar", "9000001005", "ayesha@gmail.com", "Tailor", "prefer_not_to_say", 0.0031, 0.0007],
    ["Nisha Patil", "9000001006", "nisha@gmail.com", "Homemaker", "married", -0.0032, 0.0015]
].map(([name, phone, email, profession, maritalStatus, latOffset, lngOffset]) => ({
    name,
    phone,
    email,
    role: "woman",
    gender: "female",
    profession,
    maritalStatus,
    identityVerified: true,
    identityVerifiedAt: new Date(),
    ...personLocation(locations.pin415616, latOffset, lngOffset)
}));

const women415605 = [
    ["Zoya Shaikh", "9000001101", "zoya@gmail.com", "Teacher", "single", 0.0012, -0.0016],
    ["Rukhsar Mulla", "9000001102", "rukhsar@gmail.com", "Student", "single", -0.0014, 0.0013],
    ["Fatima Khan", "9000001103", "fatima@gmail.com", "Housewife", "married", 0.0026, 0.0009],
    ["Sana Pawar", "9000001104", "sana@gmail.com", "Nurse", "married", -0.0021, -0.0012]
].map(([name, phone, email, profession, maritalStatus, latOffset, lngOffset]) => ({
    name,
    phone,
    email,
    role: "woman",
    gender: "female",
    profession,
    maritalStatus,
    identityVerified: true,
    identityVerifiedAt: new Date(),
    ...personLocation(locations.pin415605, latOffset, lngOffset)
}));

const workers415616 = [
    ["Ramesh Plumber", "9000002001", "plumber@gmail.com", "Plumber", "male", 0.0008, -0.0024],
    ["Prakash Electrician", "9000002002", "electrician@gmail.com", "Electrician", "male", -0.0024, 0.0006],
    ["Farida Tailor", "9000002003", "tailor@gmail.com", "Tailor", "female", 0.0028, 0.0021],
    ["Sameer Driver", "9000002004", "driver@gmail.com", "Auto driver", "male", -0.0011, -0.0027]
].map(([name, phone, email, workType, gender, latOffset, lngOffset]) => ({
    name,
    phone,
    email,
    role: "worker",
    gender,
    workType,
    profession: workType,
    idVerified: true,
    ...personLocation(locations.pin415616, latOffset, lngOffset)
}));

const workers415605 = [
    ["Akbar Plumber", "9000002101", "plumber415605@gmail.com", "Plumber", "male", 0.0011, 0.0020],
    ["Salma Tailor", "9000002102", "tailor415605@gmail.com", "Tailor", "female", -0.0016, -0.0011],
    ["Vivek Tutor", "9000002103", "tutor415605@gmail.com", "Tutor", "male", 0.0022, -0.0024]
].map(([name, phone, email, workType, gender, latOffset, lngOffset]) => ({
    name,
    phone,
    email,
    role: "worker",
    gender,
    workType,
    profession: workType,
    idVerified: true,
    ...personLocation(locations.pin415605, latOffset, lngOffset)
}));

const users = [
    ...women415616,
    ...women415605,
    ...workers415616,
    ...workers415605
];

const experiences = [
    {
        title: "Market road felt safer after sunset",
        content: "The main market stretch stayed busy and well lit around 8 PM.",
        category: "positive_experience",
        sharedBy: "meera@gmail.com"
    },
    {
        title: "Avoid the quiet lane near the beach approach",
        content: "The lane gets isolated after shops close. Share live location if you need to pass through.",
        category: "safety_tip",
        sharedBy: "seher@gmail.com"
    },
    {
        title: "Chiplun bus stand was crowded but safe",
        content: "Several families and vendors were around the bus stand in the evening.",
        category: "positive_experience",
        sharedBy: "zoya@gmail.com"
    }
];

const alerts = [
    {
        type: "unsafe_area",
        description: "Streetlights are out near the inner road after the market closes.",
        latitude: 16.9886,
        longitude: 73.3099,
        raisedBy: "madiha@gmail.com"
    },
    {
        type: "suspicious_activity",
        description: "Repeated loitering reported near a quiet stop after 9 PM.",
        latitude: 16.9922,
        longitude: 73.3141,
        raisedBy: "samiya@gmail.com"
    },
    {
        type: "other",
        description: "Road repair near Chiplun market is narrowing the walking path.",
        latitude: 17.5329,
        longitude: 73.5195,
        raisedBy: "fatima@gmail.com"
    }
];

const opportunities = [
    {
        title: "Math tutor for class 8",
        description: "Need two evening sessions per week near Ratnagiri.",
        category: "teaching",
        pay: "Rs. 350 per session",
        postedBy: "meera@gmail.com"
    },
    {
        title: "Blouse alteration help",
        description: "Simple alteration work needed this week.",
        category: "custom",
        pay: "Rs. 250",
        postedBy: "ayesha@gmail.com"
    },
    {
        title: "Babysitting for Saturday evening",
        description: "Need a trusted local helper for three hours.",
        category: "babysitting",
        pay: "Rs. 600",
        postedBy: "sana@gmail.com"
    }
];

const connectionPlan = [
    ["meera@gmail.com", "seher@gmail.com"],
    ["meera@gmail.com", "madiha@gmail.com"],
    ["seher@gmail.com", "samiya@gmail.com"],
    ["zoya@gmail.com", "rukhsar@gmail.com"]
];

const ratingPlan = [
    ["plumber@gmail.com", "meera@gmail.com", 5],
    ["plumber@gmail.com", "seher@gmail.com", 4],
    ["plumber@gmail.com", "madiha@gmail.com", 5],
    ["electrician@gmail.com", "meera@gmail.com", 4],
    ["electrician@gmail.com", "samiya@gmail.com", 5],
    ["tailor@gmail.com", "ayesha@gmail.com", 5],
    ["tailor@gmail.com", "nisha@gmail.com", 5],
    ["driver@gmail.com", "meera@gmail.com", 4],
    ["plumber415605@gmail.com", "zoya@gmail.com", 5],
    ["tailor415605@gmail.com", "fatima@gmail.com", 4],
    ["tutor415605@gmail.com", "rukhsar@gmail.com", 5]
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

async function wipeDatabase() {
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
}

async function seed() {
    if(!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is missing in server/.env");
    }

    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    await wipeDatabase();

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

    await User.findByIdAndUpdate(people.get("seher@gmail.com")._id, {
        sharingWith: [people.get("meera@gmail.com")._id, people.get("madiha@gmail.com")._id],
        sharingExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
    });

    await User.findByIdAndUpdate(people.get("zoya@gmail.com")._id, {
        sharingWith: [people.get("rukhsar@gmail.com")._id],
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
        await Experience.create({
            ...item,
            locality: author.locality,
            sharedBy: author._id,
            likes: [people.get("meera@gmail.com")._id, people.get("seher@gmail.com")._id].filter(Boolean)
        });
    }

    for(const item of alerts) {
        const reporter = people.get(item.raisedBy);
        await Alert.create({
            ...item,
            locality: reporter.locality,
            raisedBy: reporter._id,
            status: "active"
        });
    }

    for(const item of opportunities) {
        const poster = people.get(item.postedBy);
        await Opportunity.create({
            ...item,
            locality: poster.locality,
            postedBy: poster._id,
            status: "open"
        });
    }

    console.log("Database wiped and reseeded.");
    console.log(`Seeded ${users.length} users across PIN 415616 and 415605.`);
    console.log(`Seeded ${alerts.length} alerts, ${experiences.length} experiences, and ${opportunities.length} opportunities.`);
    console.log(`Demo password for every seeded account: ${password}`);
    console.log("Primary login: meera@gmail.com / 123");
    console.log("Change-locality test login: zoya@gmail.com / 123");
}

seed()
    .catch((error) => {
        console.error("Seed failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
