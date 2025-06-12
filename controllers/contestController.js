const { Contest, User, Theme } = require('../models'); // ✅ Ensure Theme is imported
const { Op, literal } = require('sequelize');
const notifyUserOnContestOpen = require('../utils/notifyUserOnContestOpen');
const jsonexport = require('jsonexport');
const fs = require('fs');
const fakeUserParticipants = require('../utils/fakeUserParticipants');

// ✅ Fetch all contests
const getAllContests = async (req, res) => {
  try {
    const contests = await Contest.findAll({
      include: [
        { model: User, attributes: ['username', 'email'] },
        {
          model: Theme,
          as: 'Theme',
          attributes: ['id', 'name', 'cover_image_url'], // ⬅️ Grab theme ID, name, and image
        },
      ],
    });
    res.json(contests);
  } catch (error) {
    console.error('❌ Error fetching contests:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ✅ Download the sample template
const downlaodContestTemplate = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        is_uploaded: true,
      },
    });

    let responseExport = users.map((user) => ({
      email: user.email,
      imageUrl: '',
    }));

    jsonexport(responseExport, function (err, csv) {
      if (err) {
        throw err;
      }
      fs.writeFile('contest_sample_template.csv', csv, function (err) {
        if (err) {
          throw err;
        }
        let readStream = fs.createReadStream('contest_sample_template.csv');
        res.setHeader(
          'Content-disposition',
          'attachment; filename=contest_sample_template.csv'
        );
        readStream.pipe(res.status(200).send(csv));
      });
    });
  } catch (error) {
    console.error('❌ Error fetching contests:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Join the fake participants
const uploadFakeParticipants = async (req, res) => {
  try {
    const { constestId } = req.body;

    const file = req.files.csv;

    if (!file || file.mimetype !== 'text/csv') {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    if (!constestId || isNaN(constestId)) {
      console.warn('Invalid or missing contest ID:', constestId);
      return res.status(400).json({ error: 'Invalid contest ID' });
    }

    const contest = await Contest.findOne({
      where: {
        id: constestId,
        status: {
          [Op.or]: ['Live'],
        },
        submission_deadline: {
          [Op.gt]: new Date(),
        },
      },
      include: [
        {
          model: Theme,
          as: 'Theme',
          attributes: ['name', 'description', 'cover_image_url'],
        },
      ],
    });

    if (!contest) {
      return res
        .status(400)
        .json({ error: 'Contest not found or it may not go live' });
    }

    const response = await fakeUserParticipants(contest, file);

    if (response.isError) {
      return res.status(500).json({
        error: response.error,
        message: 'Error in the Fake user voting',
      });
    }

    return res.status(200).json({
      contest,
      message: response.message,
      count: response?.count || 0,
      userErrorArr: response?.errorArr,
    });
  } catch (error) {
    console.error('❌ Error fetching contest by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ✅ Fetch a single contest by ID
const getContestById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      console.warn('⚠️ Invalid or missing contest ID:', id);
      return res.status(400).json({ error: 'Invalid contest ID' });
    }

    const contest = await Contest.findByPk(id, {
      include: [
        { model: User, attributes: ['username', 'email'] },
        {
          model: Theme,
          as: 'Theme',
          attributes: ['name', 'description', 'cover_image_url'],
        },
      ],
    });

    if (!contest) {
      console.warn('⚠️ No contest found for ID:', id);
      return res.status(404).json({ error: 'Contest not found' });
    }

    res.json(contest);
  } catch (error) {
    console.error('❌ Error fetching contest by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getLiveAndUpcomingContests = async (req, res) => {
  try {
    const contests = await Contest.findAll({
      where: {
        status: {
          [Op.or]: ['Live', 'Upcoming'],
        },
        submission_deadline: {
          [Op.gt]: new Date(),
        },
      },
      include: [
        {
          model: Theme,
          as: 'Theme',
          attributes: ['name', 'description', 'cover_image_url'],
        },
        // {
        //   model: Competition,
        //   attributes: ['id', 'user1_id', 'user2_id'],
        //   where: {
        //     [Op.and]: [
        //       {
        //         [Op.or]: [{ user1_id: req.user.id }, { user2_id: req.user.id }],
        //       },
        //       {
        //         status: {
        //           [Op.ne]: 'Complete',
        //         },
        //       },
        //     ],
        //   },
        //   required: false, // important: still get contests even if no competition matches
        // },
      ],
      order: [
        [
          literal(`CASE
          WHEN "Contest"."status" = 'Live' THEN 0
          WHEN "Contest"."status" = 'Upcoming' THEN 1
          ELSE 2 END`),
          'ASC',
        ],
      ],
    });

    res.json(contests);
  } catch (error) {
    console.error('❌ Error fetching live & upcoming contests:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ✅ Fetch only live contests
const getLiveContests = async (req, res) => {
  try {
    const liveContests = await Contest.findAll({
      where: {
        status: 'Live',
        voting_deadline: {
          [Op.gt]: new Date(),
        },
        voting_live_date: {
          [Op.lt]: new Date(),
        },
      },
      include: [
        {
          model: Theme,
          as: 'Theme', // ✅ Ensure this matches the alias in Contest.associate()
          attributes: ['name', 'description', 'cover_image_url'], // ✅ Fetch only required fields
        },
      ],
    });

    res.json(liveContests);
  } catch (error) {
    console.error('❌ Error fetching live contests:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ✅ Create a new contest
const createContest = async (req, res) => {
  try {
    const {
      creator_id,
      theme_id,
      status,
      entry_fee,
      prize_pool,
      submission_deadline,
      voting_live_date,
      voting_deadline,
      winnings,
      total_entries,
      contest_live_date,
    } = req.body;

    const newContest = await Contest.create({
      creator_id,
      theme_id,
      status: status
        ? status
        : new Date(contest_live_date) < new Date()
        ? 'Live'
        : 'Upcoming', // Default to 'Live' if not provided
      entry_fee,
      prize_pool,
      submission_deadline,
      voting_live_date,
      voting_deadline,
      winnings,
      total_entries,
      contest_live_date,
    });

    res.status(201).json(newContest);
  } catch (error) {
    console.error('❌ Error creating contest:', error.message, error.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateContest = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFields = req.body;

    const contest = await Contest.findByPk(id);

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    if (
      contest.status !== 'Live' &&
      updatedFields.status === 'Live' &&
      contest.notify_users === false
    ) {
      updatedFields['notify_users'] = true;

      await notifyUserOnContestOpen();
    }
    await contest.update(updatedFields);

    // Fetch updated contest with Theme info
    const updatedContest = await Contest.findByPk(id, {
      include: [
        { model: User, attributes: ['username', 'email'] },
        {
          model: Theme,
          as: 'Theme',
          attributes: ['id', 'name', 'cover_image_url'],
        },
      ],
    });

    res.status(200).json(updatedContest);
  } catch (error) {
    console.error('❌ Error updating contest:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ✅ Delete a contest by ID
const deleteContest = async (req, res) => {
  try {
    const { id } = req.params;

    const contest = await Contest.findByPk(id);

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    await contest.destroy();
    res
      .status(200)
      .json({ message: `Contest with ID ${id} deleted successfully` });
  } catch (error) {
    console.error('❌ Error deleting contest:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ✅ Export functions correctly
module.exports = {
  getAllContests,
  downlaodContestTemplate,
  uploadFakeParticipants,
  getContestById,
  getLiveContests,
  getLiveAndUpcomingContests,
  createContest,
  updateContest,
  deleteContest,
};
