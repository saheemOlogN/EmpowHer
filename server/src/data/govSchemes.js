export const GOV_SCHEMES = [
    {
        id: "pmmvy",
        name: "Pradhan Mantri Matru Vandana Yojana",
        forWhom: "Pregnant women and lactating mothers",
        benefit: "Maternity benefit support through eligible installments.",
        eligibility: {
            isPregnantOrNewMother: true
        },
        officialLink: "https://www.myscheme.gov.in/schemes/pmmvy"
    },
    {
        id: "bbbp",
        name: "Beti Bachao Beti Padhao",
        forWhom: "Girls, families, and communities supporting girl child survival, protection, and education",
        benefit: "Awareness, convergence, and local support for girl child education and protection.",
        eligibility: {},
        officialLink: "https://www.pmindia.gov.in/en/government_tr_rec/beti-bachao-beti-padhao-caring-for-the-girl-child/"
    },
    {
        id: "stand-up-india",
        name: "Stand-Up India",
        forWhom: "Women entrepreneurs and SC/ST entrepreneurs starting greenfield enterprises",
        benefit: "Bank loans for eligible greenfield enterprise setup.",
        eligibility: {
            occupation: ["entrepreneur", "self_employed"]
        },
        officialLink: "https://www.standupmitra.in/"
    },
    {
        id: "mahila-shakti-kendra",
        name: "Mahila Shakti Kendra",
        forWhom: "Women seeking community-level empowerment and support services",
        benefit: "Community support, information, and facilitation for women-focused schemes and services.",
        eligibility: {},
        officialLink: "https://wcd.nic.in/schemes/mahila-shakti-kendras-msk"
    },
    {
        id: "sukanya-samriddhi-yojana",
        name: "Sukanya Samriddhi Yojana",
        forWhom: "Girl children and their guardians",
        benefit: "Small savings account for long-term financial security of a girl child.",
        eligibility: {},
        officialLink: "https://www.indiapost.gov.in/Financial/Pages/Content/Sukanya-Samriddhi-Account.aspx"
    },
    {
        id: "pm-mudra-yojana",
        name: "Pradhan Mantri Mudra Yojana",
        forWhom: "Micro and small entrepreneurs",
        benefit: "Collateral-free institutional credit for eligible micro enterprises.",
        eligibility: {
            occupation: ["entrepreneur", "self_employed", "farmer"]
        },
        officialLink: "https://financialservices.gov.in/pradhan-mantri-mudra-yojana-pmmy"
    },
    {
        id: "mazi-ladki-bahin",
        name: "Mukhyamantri Mazi Ladki Bahin Yojana",
        forWhom: "Eligible women residents of Maharashtra",
        benefit: "Monthly financial assistance through DBT for eligible women.",
        eligibility: {
            state: "Maharashtra",
            minAge: 21,
            maxAge: 65,
            annualIncomeMax: 250000
        },
        officialLink: "https://ladakibahin.maharashtra.gov.in/"
    }
];
