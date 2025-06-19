// controllers/reportController.js
const {
  Report,
  Competition,
  User,
  Contest,
  Theme,
  sequelize,
  ActionAfterReports,
} = require('../models');
const sendUpdateImageEmail = require('../utils/sendUpdateImageEmail');
const denyUpdateImageEmail = require('../utils/denyUpdateImageEmail');

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

    res.status(201).json({ message: 'Report submitted', report });
  } catch (err) {
    console.error('❌ Error submitting report:', err);
    res
      .status(500)
      .json({ message: 'Internal server error', error: err.message });
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @description List all the reports
 * @routes (GET /get-reports)
 * @returns HTTP Response
 * @author Dhrumil Amrutiya (Zignuts)
 */
exports.getReports = async (req, res) => {
  const { status = 'All', skip = 0, limit = 10 } = req.query;

  let whereClause = '';
  if (status !== 'All') {
    whereClause = `WHERE COALESCE(A."status", R."status") = '${status}'`;
  }
  try {
    let queryString = `
    SELECT
      COALESCE(A."status", R."status") as "final_status",
      A."updatedAt" as "violation_action_time",
      R.*,
      U1."id" AS "reporter_user_id",
      U1."username" AS "reporter_user_username",
      U1."email" AS "reporter_user_email",
      U2."id" AS "reported_user_id",
      U2."username" AS "reported_user_username",
      U2."email" AS "reported_user_email",
      C."id" AS "competition_id",
      C."contest_id" AS "competition_contest_id",
      C."user1_id" AS "competition_user1_id",
      C."user2_id" AS "competition_user2_id",
      C."user1_image" AS "competition_user1_image",
      C."user2_image" AS "competition_user2_image",
      C."match_type" AS "competition_match_type",
      C."status" AS "competition_status",
      T."id" AS "theme_id",
      T."name" AS "theme_name",
      T."cover_image_url" AS "theme_cover_image_url"
    FROM
      "Reports" R
      JOIN "Users" U1 ON U1."id" = R."reporter_id"
      JOIN "Users" U2 ON U2."id" = R."reported_user_id"
      JOIN "Competitions" C ON C."id" = R."competition_id"
      JOIN "Contests" CT ON CT."id" = C."contest_id"
      JOIN "Themes" T ON T."id" = CT."theme_id"
      LEFT JOIN "ActionAfterReports" AS A ON A."competition_id" = R."competition_id"
      AND R."image_url" = A."old_image_url"
     ${whereClause}
     ORDER BY R."createdAt" DESC
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

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @description get the report by id with the violation action object
 * @routes (GET /get-reports/:reportId)
 * @returns HTTP Response
 * @author Dhrumil Amrutiya (Zignuts)
 */
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
            'user1_flagged',
            'user2_flagged',
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

    const findActionStatus = await ActionAfterReports.findOne({
      where: {
        competition_id: allReports.competition_id,
        reported_user_id: allReports.reported_user_id,
        old_image_url: allReports.image_url,
      },
    });

    return res.status(200).json({
      message: 'Report list',
      report: {
        ...allReports?.toJSON(),
        ViolationAction: findActionStatus?.toJSON() || {},
      },
    });
  } catch (err) {
    console.error('❌ Error submitting report:', err);
    res
      .status(500)
      .json({ message: 'Internal server error', error: err.message });
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @description update the report status
 * @routes (POST /update-report-status)
 * @returns HTTP Response
 * @author Dhrumil Amrutiya (Zignuts)
 */
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

    if (status === 'Violation') {
      const findUser = await User.findOne({
        where: { id: findReport.reported_user_id },
        attributes: ['id', 'username', 'email'],
      });

      const createAction = await ActionAfterReports.create({
        reported_user_id: findReport.reported_user_id,
        competition_id: findReport.competition_id,
        old_image_url: findReport.image_url,
        status: 'User Action Pending',
      });

      const findTheme = await Competition.findOne({
        where: {
          id: findReport.competition_id,
        },
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
      });

      if (findTheme.user1_id === findReport.reported_user_id) {
        findTheme.user1_flagged = true;
      } else {
        findTheme.user2_flagged = true;
      }

      await findTheme.save();

      await sendUpdateImageEmail(
        findUser.email,
        findUser.username,
        findReport.competition_id,
        findTheme.Contest.Theme.name
      );
    }

    await Report.update(
      { status: status },
      {
        where: {
          competition_id: findReport.competition_id,
          image_url: findReport.image_url,
        },
      }
    );

    if (status === 'No Violation') {
      const findViolationAction = await ActionAfterReports.findOne({
        where: {
          competition_id: findReport.competition_id,
          old_image_url: findReport.image_url,
          reported_user_id: findReport.reported_user_id,
        },
      });

      if (findViolationAction) {
        const findCompetition = await Competition.findOne({
          where: {
            id: findReport.competition_id,
          },
        });

        if (
          findCompetition.user1_flagged &&
          findCompetition.user1_id === findReport.reported_user_id
        ) {
          findCompetition.user1_flagged = false;
        } else {
          findCompetition.user2_flagged = false;
        }
        findCompetition.save();
        await findViolationAction.destroy();
      }
    }

    return res.status(200).json({ message: 'Report list', report: findReport });
  } catch (err) {
    console.error('❌ Error submitting report:', err);
    return res
      .status(500)
      .json({ message: 'Internal server error', error: err.message });
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @description List all the users who got reported and their report count
 * @routes (GET /get-reported-users)
 * @returns HTTP Response
 * @author Dhrumil Amrutiya (Zignuts)
 */
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

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @description List all the images which are reported and their report count
 * @routes (GET /get-reported-images)
 * @returns HTTP Response
 * @author Dhrumil Amrutiya (Zignuts)
 */
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

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @description List perticular User's all the reports by Ids
 * @routes (GET /get-reported-user/:userId)
 * @returns HTTP Response
 * @author Dhrumil Amrutiya (Zignuts)
 */
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

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @description change the reported user status Ban or Warn
 * @routes (POST /action-on-reported-user)
 * @returns HTTP Response
 * @author Dhrumil Amrutiya (Zignuts)
 */
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

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @description Admin replace the vilated image
 * @routes (POST /update-image)
 * @returns HTTP Response
 * @author Dhrumil Amrutiya (Zignuts)
 */
exports.updateViolationImages = async (req, res) => {
  try {
    const { competitionId, newImageUrl, reportedUserId } = req.body;

    if (!competitionId || !newImageUrl) {
      return res.status(400).json({
        message: 'competitionId and newImageUrl are required.',
      });
    }

    const competition = await Competition.findOne({
      where: { id: competitionId },
    });

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found.' });
    }

    let violatedImageUrl = null;
    let user = '';

    if (req.user.role === 'participant') {
      if (competition.user1_flagged && competition.user1_id === req.user.id) {
        violatedImageUrl = competition.user1_image;
        user = 'user1';
      } else if (
        competition.user2_flagged &&
        competition.user2_id === req.user.id
      ) {
        violatedImageUrl = competition.user2_image;
        user = 'user2';
      }
    } else {
      if (
        competition.user1_flagged &&
        competition.user1_id === reportedUserId
      ) {
        violatedImageUrl = competition.user1_image;
        user = 'user1';
      } else if (
        competition.user2_flagged &&
        competition.user2_id === reportedUserId
      ) {
        violatedImageUrl = competition.user2_image;
        user = 'user2';
      }
    }

    if (!violatedImageUrl) {
      return res.status(400).json({
        message: 'Can not find the Violated Image',
      });
    }

    const findViolationAction = await ActionAfterReports.findOne({
      where: {
        competition_id: competition.id,
        old_image_url: violatedImageUrl,
      },
    });

    if (findViolationAction.status === 'Complete') {
      return res.status(400).json({
        message: 'Violation Action was Completed',
      });
    }

    const [count, updateReportAction] = await ActionAfterReports.update(
      {
        new_image_url: newImageUrl,
        status:
          req.user.role === 'participant' ? 'Admin Review Pending' : 'Complete',
      },
      {
        where: {
          competition_id: competition.id,
          old_image_url: violatedImageUrl,
        },
        returning: true,
      }
    );

    if (updateReportAction[0]?.status === 'Complete') {
      if (user === 'user1') {
        competition.user1_flagged = false;
        competition.user1_image = newImageUrl;
      } else {
        competition.user2_flagged = false;
        competition.user2_image = newImageUrl;
      }

      await competition.save();
    }

    res.status(200).json({
      message: 'Violation image updated successfully.',
      competition,
    });
  } catch (error) {
    console.error('❌ Error updating violation image:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @description Admin Approve and Deny the replaced image by User
 * @routes (POST /update-violation-image-status)
 * @returns HTTP Response
 * @author Dhrumil Amrutiya (Zignuts)
 */
exports.updateViolationImagesStaus = async (req, res) => {
  try {
    const { violationActionId, isApprove = false } = req.body;

    const findReportAction = await ActionAfterReports.findOne({
      where: {
        id: violationActionId,
      },
      include: [
        {
          model: Competition,
          attributes: ['id'],
        },
      ],
    });

    if (!findReportAction) {
      return res.status(400).json({
        message: 'Report not found',
      });
    }

    const competition = await Competition.findOne({
      where: { id: findReportAction.Competition.id },
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
    });

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found.' });
    }

    await ActionAfterReports.update(
      {
        status: isApprove ? 'Complete' : 'User Action Pending',
      },
      {
        where: {
          id: violationActionId,
        },
      }
    );

    if (isApprove === true || isApprove === 'true') {
      if (
        competition.user1_flagged &&
        competition.user1_image === findReportAction.old_image_url
      ) {
        competition.user1_flagged = false;
        competition.user1_image = findReportAction.new_image_url;
      } else {
        competition.user2_flagged = false;
        competition.user2_image = findReportAction.new_image_url;
      }

      await competition.save();
    } else {
      let userId;
      if (
        competition.user1_flagged &&
        competition.user1_image === findReportAction.old_image_url
      ) {
        userId = competition.user1_id;
      } else {
        userId = competition.user2_id;
      }

      const findUser = await User.findOne({ where: { id: userId } });
      await denyUpdateImageEmail(
        findUser.email,
        findUser.username,
        competition.id,
        competition.Contest.Theme.name
      );
    }

    return res.status(200).json({
      message: 'Violation image updated successfully.',
      competition,
    });
  } catch (error) {
    console.error('❌ Error updating violation image:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
