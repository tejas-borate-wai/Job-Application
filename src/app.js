require("dotenv").config();
const fs = require("fs"); // Import File System to read the HTML file
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");

const express = require("express");

// for using path add these liabrary
const path = require("path");

// create an express app
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

// added jobs file
const JOBS = require("./jobs");

// adding mustache template engine for use
const mustacheExpress = require("mustache-express");

// connfigure mustache
app.set("views", path.join(__dirname, "pages"));
app.set("view engine", "mustache");
app.engine("mustache", mustacheExpress());

// serving statics files to the server
app.use(express.static(path.join(__dirname, "public")));

// create a base url for rendering index page at '/' url
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/job-list", (req, res) => {
  res.render("job-list", { jobs: JOBS });
});

app.get("/view/:id", (req, res) => {
  const jobId = req.params.id;
  const matchedJob = JOBS.find((job) => job.id.toString() === jobId);
  res.render("view-job", { matchedJob: matchedJob });
});

app.get("/apply-now/:id", (req, res) => {
  const jobId = req.params.id;
  const Job = JOBS.find((job) => job.id.toString() === jobId);
  console.log(Job);
  res.render("apply-now", { Job: Job });
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.post("/applied_job/:id", (req, res) => {
  const { job_title, name, email, phone, resume, coverLetter } = req.body;
  const matchingJobs = req.params.id;
  const Job = JOBS.find((job) => job.id.toString() === matchingJobs);

  // Read HTML Template and replace placeholders
  let emailTemplate = fs.readFileSync(
    path.join(__dirname, "public/emailTemplate.html"),
    "utf8"
  );
  emailTemplate = emailTemplate
    .replace("{{name}}", name)
    .replace("{{title}}", job_title);

  console.log(Job);

  console.log(req.body);
  console.log("Email User:", process.env.EMAIL_ID);
  console.log(
    "Email Pass:",
    process.env.EMAIL_PASSWORD ? "Loaded" : "Missing!"
  );

  // / Create transporter with SMTP settings
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465, // Secure SMTP port (587 for TLS, 465 for SSL)
    secure: true, // true for 465 (SSL), false for 587 (TLS)
    auth: {
      user: process.env.EMAIL_ID, // Your Gmail address
      pass: process.env.EMAIL_PASSWORD, // App Password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_ID, // Sender email (your email)
    to: email, // Receiver email (HR or company email)
    subject: `Application Received: ${job_title}`,
    html: emailTemplate, // Send HTML content
  };

  // Send email with callback function
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      return res.status(500).render("failed"); // Renders failed.html page
    } else {
      console.log("Email sent successfully:", info.response);
      return res.status(200).render("success"); // Renders success.html page
    }
  });
});

// create port
const port = process.env.PORT || 3000;

// using port render our app
app.listen(port, () => {
  console.log(`app is running on ${port}`);
});
