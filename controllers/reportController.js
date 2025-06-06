// controllers/reportController.js
const {
  Report,
  Competition,
  User,
  Contest,
  Theme,
  sequelize,
} = require('../models');

exports.submitReport = async (req, res) => {
  const { reporterId, competitionId, imageUrl, categories, description } =
    req.body;

  if (!reporterId || !competitionId || !imageUrl || !categories?.length) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const competition = await Competition.findByPk(competitionId);
    if (!competition)
      return res.status(404).json({ message: 'Competition not found' });

    let reportedUserId = null;
    if (imageUrl === competition.user1_image) {
      reportedUserId = competition.user1_id;
    } else if (imageUrl === competition.user2_image) {
      reportedUserId = competition.user2_id;
    } else {
      return res
        .status(400)
        .json({ message: 'Image not part of this competition' });
    }

    const report = await Report.create({
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      competition_id: competitionId,
      image_url: imageUrl,
      categories,
      description,
    });

    // ✅ Optional: flag image in the competition
    if (imageUrl === competition.user1_image) {
      competition.user1_flagged = true;
    } else {
      competition.user2_flagged = true;
    }
    await competition.save();

    res.status(201).json({ message: 'Report submitted', report });
  } catch (err) {
    console.error('❌ Error submitting report:', err);
    res
      .status(500)
      .json({ message: 'Internal server error', error: err.message });
  }
};

exports.getReports = async (req, res) => {
  const { status = 'All', skip = 0, limit = 10 } = req.query;

  let whereClause = {};
  if (status !== 'All') {
    whereClause = {
      status: status,
    };
  }
  try {
    const allReportsCount = await Report.count({
      include: [
        {
          model: User,
          as: 'Reporter',
          attributes: ['id', 'username', 'email'],
        },
        {
          model: User,
          as: 'ReportedUser',
          attributes: ['id', 'username', 'email'],
        },
        {
          model: Competition,
          attributes: [
            'id',
            'contest_id',
            'user1_id',
            'user2_id',
            'user1_image',
            'user2_image',
            'match_type',
            'status',
          ],
          include: [
            {
              model: Contest,
              // as: 'Theme',
              attributes: ['id'],
              include: [
                {
                  model: Theme,
                  as: 'Theme',
                  attributes: ['id', 'name', 'cover_image_url'],
                },
              ],
            },
          ],
        },
      ],
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });

    const allReports = await Report.findAll({
      include: [
        {
          model: User,
          as: 'Reporter',
          attributes: ['id', 'username', 'email'],
        },
        {
          model: User,
          as: 'ReportedUser',
          attributes: ['id', 'username', 'email'],
        },
        {
          model: Competition,
          attributes: [
            'id',
            'contest_id',
            'user1_id',
            'user2_id',
            'user1_image',
            'user2_image',
            'match_type',
            'status',
          ],
          include: [
            {
              model: Contest,
              // as: 'Theme',
              attributes: ['id'],
              include: [
                {
                  model: Theme,
                  as: 'Theme',
                  attributes: ['id', 'name', 'cover_image_url'],
                },
              ],
            },
          ],
        },
      ],
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: Number(skip),
    });

    return res.status(200).json({
      message: 'Report list',
      reportCount: allReportsCount,
      report: allReports,
    });
  } catch (err) {
    console.error('❌ Error submitting report:', err);
    res
      .status(500)
      .json({ message: 'Internal server error', error: err.message });
  }
};

exports.getReportsById = async (req, res) => {
  const { reportId } = req.params;
  try {
    const allReports = await Report.findOne({
      include: [
        {
          model: User,
          as: 'Reporter',
          attributes: ['id', 'username', 'email'],
        },
        {
          model: User,
          as: 'ReportedUser',
          attributes: ['id', 'username', 'email'],
        },
        {
          model: Competition,
          attributes: [
            'id',
            'contest_id',
            'user1_id',
            'user2_id',
            'user1_image',
            'user2_image',
            'match_type',
            'status',
          ],
          include: [
            {
              model: Contest,
              // as: 'Theme',
              attributes: ['id'],
              include: [
                {
                  model: Theme,
                  as: 'Theme',
                  attributes: ['id', 'name', 'cover_image_url'],
                },
              ],
            },
          ],
        },
      ],
      where: { id: reportId },
    });

    return res.status(200).json({ message: 'Report list', report: allReports });
  } catch (err) {
    console.error('❌ Error submitting report:', err);
    res
      .status(500)
      .json({ message: 'Internal server error', error: err.message });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { reportId, status = 'No Violation' } = req.body;

    if (!reportId || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const findReport = await Report.findByPk(reportId);

    if (!findReport) {
      return res.status(400).json({ message: 'User not found' });
    }

    findReport.status = status;

    await findReport.save();

    return res.status(200).json({ message: 'Report list', report: findReport });
  } catch (err) {
    console.error('❌ Error submitting report:', err);
    return res
      .status(500)
      .json({ message: 'Internal server error', error: err.message });
  }
};

exports.getReportedUser = async (req, res) => {
  const { skip = 0, limit = 10 } = req.query;
  try {
    let queryString = `
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY
          MAX(R."createdAt") DESC
      ) AS "id",
      R."reported_user_id",
      MAX(R."createdAt") as "createdAt",
      COUNT(R.*),
      U."username"
    FROM
      PUBLIC."Reports" R
      JOIN "Users" U ON U."id" = R."reported_user_id"
    GROUP BY
      R."reported_user_id",
      U."username"
    ORDER BY
      COUNT(R.*) DESC,
      MAX(R."createdAt") DESC
    `;

    const resultCount = await sequelize.query(queryString, {
      type: sequelize.QueryTypes.SELECT,
    });

    if (limit >= 0 && skip >= 0) {
      queryString += ` LIMIT ${limit} OFFSET ${skip}`;
    }

    const result = await sequelize.query(queryString, {
      type: sequelize.QueryTypes.SELECT,
    });

    return res.status(200).json({
      message: 'Report list',
      reportCount: resultCount.length,
      report: result,
    });
  } catch (err) {
    console.error('❌ Error submitting report:', err);
    res
      .status(500)
      .json({ message: 'Internal server error', error: err.message });
  }
};

exports.getReportedImages = async (req, res) => {
  const { skip = 0, limit = 10 } = req.query;
  try {
    let queryString = `
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY
          MAX(R."createdAt") DESC
      ) AS "id",
      R."reported_user_id",
      R."image_url",
      R."competition_id",
      MAX(R."createdAt") as "createdAt",
      COUNT(R.*),
      U."username",
      TH."id" as "theme_id",
      TH."name" as "theme_name",
      TH."cover_image_url" as "theme_cover_image_url"
    FROM
      PUBLIC."Reports" R
      JOIN "Users" U ON U."id" = R."reported_user_id"
      JOIN "Competitions" as CP on CP."id" = R."competition_id"
      JOIN "Contests" as CT on CT."id" = CP."contest_id"
      JOIN "Themes" as TH on TH."id" = CT."theme_id"
    GROUP BY
      R."reported_user_id",
      U."username",
      R."image_url",
      R."competition_id",
      TH."id",
      TH."name",
      TH."cover_image_url"
    ORDER BY
      COUNT(R.*) DESC,
      MAX(R."createdAt") DESC
    `;

    const resultCount = await sequelize.query(queryString, {
      type: sequelize.QueryTypes.SELECT,
    });

    if (limit >= 0 && skip >= 0) {
      queryString += ` LIMIT ${limit} OFFSET ${skip}`;
    }

    const result = await sequelize.query(queryString, {
      type: sequelize.QueryTypes.SELECT,
    });

    return res.status(200).json({
      message: 'Report list',
      reportCount: resultCount.length,
      report: result,
    });
  } catch (err) {
    console.error('❌ Error submitting report:', err);
    res
      .status(500)
      .json({ message: 'Internal server error', error: err.message });
  }
};

exports.getReportedUserById = async (req, res) => {
  const { userId } = req.params;
  try {
    const reportReceived = await User.findOne({
      where: {
        id: userId,
      },
      attributes: [
        'id',
        'username',
        'email',
        'role',
        'date_of_birth',
        'status',
      ],
      include: [
        {
          model: Report,
          as: 'ReportsReceived',
          attributes: [
            'id',
            'reporter_id',
            'competition_id',
            'image_url',
            'categories',
            'description',
            'status',
            'createdAt',
          ],
          include: [
            {
              model: User,
              as: 'Reporter',
              attributes: ['id', 'username', 'email'],
            },
            {
              model: Competition,
              attributes: ['id', 'status'],
              include: [
                {
                  model: Contest,
                  attributes: ['id'],
                  include: [
                    {
                      model: Theme,
                      as: 'Theme',
                      attributes: ['id', 'name', 'cover_image_url'],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    return res
      .status(200)
      .json({ message: 'Report list', report: reportReceived });
  } catch (err) {
    console.error('❌ Error submitting report:', err);
    res
      .status(500)
      .json({ message: 'Internal server error', error: err.message });
  }
};

exports.actionOnReportedUser = async (req, res) => {
  try {
    const { userId, status = 'Warn' } = req.body;

    if (!userId || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const findUser = await User.findByPk(userId);

    if (!findUser) {
      return res.status(400).json({ message: 'User not found' });
    }

    findUser.status = status;

    await findUser.save();

    const userData = findUser.toJSON();
    delete userData.password;

    return res.status(200).json({ message: 'Report list', user: userData });
  } catch (err) {
    console.error('❌ Error submitting report:', err);
    return res
      .status(500)
      .json({ message: 'Internal server error', error: err.message });
  }
};
