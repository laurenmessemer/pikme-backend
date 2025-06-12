const { PendingCompetition, User } = require('../models');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { default: axios } = require('axios');
const shuffleArray = require('./shuffleArray');
const convertToS3Url = require('./convertToS3Url');

const fakeUserParticipants = async (contest, file) => {
  try {
    const readable = Readable.from(file.data);
    const results = [];

    const errorArr = [];
    const handleError = (line, email, message) => {
      errorArr.push({ line, email, message });
    };

    const parsedData = await new Promise((resolve, reject) => {
      readable
        .pipe(csv())
        .on('data', (row) => {
          results.push(row);
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (err) => {
          reject(err);
        });
    });

    // get the half users
    const slicedArr = parsedData.slice(0, parseInt(parsedData.length / 2));

    // shuffed users and combine the users
    let shuffled = [...(await shuffleArray(parsedData)), ...slicedArr];

    const imageUrlRegex = /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let count = 0;
    for (let i = 0; i < shuffled.length; i++) {
      const user = shuffled[i];

      if (user.email && user.imageUrl) {
        if (!emailRegex.test(user.email)) {
          await handleError(i + 2, user?.email, 'Invalid Email Format');
          continue;
        }

        if (!imageUrlRegex.test(user.imageUrl)) {
          await handleError(i + 2, user?.email, 'Invalid Image URL');
          continue;
        }

        try {
          const apiResponse = await axios.post(
            process.env.BACKEND_URL + 'api/auth/login', // target API
            {
              password: 'TestUser@123',
              email: user.email.trim(),
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          const newImageUrl = await convertToS3Url(
            user.imageUrl,
            apiResponse.data.user.id
          );

          if (newImageUrl.isError) {
            await handleError(i + 2, user?.email, newImageUrl.message);
            continue;
          }

          // ✅ Store entry in database (without confirming payment yet)
          const pendingEntry = await PendingCompetition.create({
            user1_id: apiResponse.data.user.id,
            contest_id: contest.id,
            status: 'waiting',
            user1_image: newImageUrl.data.trim(),
          });

          const updateImage = await axios.post(
            process.env.BACKEND_URL + 'api/competition-entry/update-image', // target API
            {
              pendingEntryId: pendingEntry.id,
              imageUrl: newImageUrl.data.trim(),
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiResponse.data.token}`,
              },
            }
          );

          const confirmPayment = await axios.post(
            process.env.BACKEND_URL + 'api/competition-entry/confirm-payment', // target API
            {
              user_id: apiResponse.data.user.id,
              contest_id: contest.id,
              entry_fee: contest.entry_fee,
              match_type: 'pick_random',
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiResponse.data.token}`,
              },
            }
          );
          count++;
        } catch (error) {
          await handleError(i + 2, user?.email, error?.response?.data?.message);
        }
      } else if (user.email || user.imageUrl) {
        await handleError(i + 2, user?.email, 'Missing Required fields');
      } else {
        // do nothing
      }
    }

    if (count > 0) {
      const findUploadedUsers = await User.findAll({
        where: {
          is_uploaded: true,
        },
      });
      for (let i = 0; i < findUploadedUsers.length; i++) {
        let user = findUploadedUsers[i].toJSON();
        if (user.email) {
          try {
            const apiResponse = await axios.post(
              process.env.BACKEND_URL + 'api/auth/login', // target API
              {
                password: 'TestUser@123',
                email: user.email.trim(),
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );

            const getVoteEntries = await axios.get(
              process.env.BACKEND_URL + 'api/vote/get-entries', // target API
              {
                params: {
                  userId: apiResponse.data.user.id,
                },
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${apiResponse.data.token}`,
                },
              }
            );

            const castVoteFunction = async (data) => {
              try {
                await axios.post(
                  process.env.BACKEND_URL + 'api/vote/vote',
                  {
                    competitionId: data.competitionId,
                    selectedImage: data.selectedImage,
                    voterId: data.voterId,
                  },
                  {
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  }
                );
                return true;
              } catch (error) {
                return false;
              }
            };

            for (
              let i = 0;
              i < getVoteEntries.data.competitions.length;
              i += 50
            ) {
              const sliceData = getVoteEntries.data.competitions.slice(
                i,
                i + 50
              );
              const responsPromise = sliceData.map((data) => {
                // random iamge selection
                const images = [data.user1_image, data.user2_image];
                return castVoteFunction({
                  competitionId: data.id,
                  selectedImage:
                    images[Math.floor(Math.random() * images.length)], // random image selection
                  voterId: apiResponse.data.user.id,
                });
              });

              response = await Promise.all(responsPromise);
            }
          } catch (error) {
            await handleError(
              i + 2,
              user?.email,
              error?.response?.data?.message
            );
          }
        } else if (user.email) {
          await handleError(i + 2, user?.email, 'Missing Required fields');
        } else {
          // do nothing
        }
      }
    }

    return {
      isError: false,
      errorArr,
      count,
      message:
        count === 0
          ? `No users joined the contest.`
          : `${count} Users Joined the Contest successfully`,
    };
  } catch (error) {
    return {
      message: 'Error in dummy user participants',
      isError: true,
      error,
    };
  }
};

module.exports = fakeUserParticipants;
