/**
 * One-time migration: backfill missing queueDate on existing queue entries.
 * Run with: node scripts/fixQueueDate.js
 *
 * Sets queueDate to the entry's addedAt date (or today if addedAt is missing).
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.atlas_URI);
  console.log('Connected to MongoDB');

  const Hospital = require('../models/Hospital');
  const hospitals = await Hospital.find({ 'queue.0': { $exists: true } });

  let totalFixed = 0;

  for (const hospital of hospitals) {
    let changed = false;
    for (const entry of hospital.queue) {
      if (!entry.queueDate) {
        // Use addedAt date if available, otherwise today
        const date = entry.addedAt
          ? new Date(entry.addedAt).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10);
        entry.queueDate = date;
        changed = true;
        totalFixed++;
      }
    }
    if (changed) {
      // Use updateOne with $set to bypass full validation on other required fields
      await Hospital.updateOne(
        { _id: hospital._id },
        { $set: { queue: hospital.queue } }
      );
      console.log(`Fixed ${hospital.hospitalName} (${hospital._id})`);
    }
  }

  console.log(`\nDone. Fixed ${totalFixed} queue entries across ${hospitals.length} hospitals.`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});