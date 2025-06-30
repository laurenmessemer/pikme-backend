import axios from "axios";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useAuth } from "../../context/UseAuth";
import "../../styles/cards/Activity.css";
import Dropdown from "../Dropdowns/Dropdown";
import ThemeTimer from "../Timers/ThemeTimer";
import { checkSuccessResponse, onImageError } from "../../utils/RouterUtils";
import LazyImage from "../Common/LazyImage";
import { ImageUrl } from "../../constant/appConstants";

const tokenImg = "https://d38a0fe14bafg9.cloudfront.net/icons/token.svg";
const pointerIcon = "https://d38a0fe14bafg9.cloudfront.net/icons/pointer.svg";
const fileIcon = `${ImageUrl}/icons/file.svg`;

const Activity = () => {
  const { user: authUser, token } = useAuth();
  const [voters, setVoters] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [myVotes, setMyVotes] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [myReferrals, setMyReferrals] = useState(0);

  useEffect(() => {
    const fetchTopVoters = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/activity/votes`,
          {
            params: { userId: authUser?.id },
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true",
            },
          }
        );
        if (checkSuccessResponse(res)) {
          setVoters(res.data.topVoters || []);
          setMyVotes(res.data.me?.count ?? 0);
          setIsLoading(false);
        }
      } catch (err) {
        setIsLoading(false);
        console.error("❌ Error fetching top voters:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchTopReferrers = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/activity/referrals`,
          {
            params: { userId: authUser?.id },
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true",
            },
          }
        );
        console.log("📈 Top Referrers Response:", res.data);
        setReferrers(res.data.topReferrers || []);
        setMyReferrals(res.data.me?.count ?? 0);
      } catch (err) {
        console.error("❌ Error fetching top referrers:", err);
      }
    };

    fetchTopVoters();
    fetchTopReferrers();
  }, [authUser?.id]);

  // const mergedVoters = useMemo(() => {
  //   return [
  //     ...voters.filter((v) => v.count >= MIN_REQUIRED_COUNT),
  //     ...fallbackVoters,
  //   ].slice(0, 9);
  // }, [voters]);

  // const mergedReferrers = useMemo(() => {
  //   return [
  //     ...referrers.filter((r) => r.count >= MIN_REQUIRED_COUNT),
  //     ...fallbackReferrers,
  //   ].slice(0, 9);
  // }, [referrers]);

  const mergedVoters = useMemo(() => {
    // Map voters and add random count for uploaded users
    const processedVoters = [...voters].map((voter) => {
      if (voter.isUploaded === true) {
        return {
          ...voter,
          count: Math.floor(Math.random() * 13) + 1, // Random number between 1-13
        };
      }
      return voter;
    });

    // Separate non-uploaded and uploaded users
    processedVoters.sort((a, b) => b.count - a.count);

    // Return non-uploaded first, then uploaded
    return [...processedVoters];
  }, [voters]);

  // const mergedVoters = useMemo(() => {
  // // Only include real voters: isUploaded must not be true
  // const realVoters = [...voters]
  //   .filter(v => !v.isUploaded)
  //   .sort((a, b) => b.count - a.count);

  // return realVoters;
  // }, [voters]);

  const mergedReferrers = useMemo(() => {
    // Map referrers and add random count for uploaded users
    const processedReferrers = [...referrers].map((referrer) => {
      if (referrer.isUploaded === true) {
        return {
          ...referrer,
          // count: Math.floor(Math.random() * 3) + 1 // Random number between 1-3
          count: 1, // Random number between 1-3
        };
      }
      return referrer;
    });

    // Separate non-uploaded and uploaded users
    processedReferrers.sort((a, b) => b.count - a.count);

    // Return non-uploaded first, then uploaded
    return [...processedReferrers];
  }, [referrers]);

  const renderToken = () => (
    <img
      src={tokenImg}
      alt="Token"
      className="inline-token"
      style={{ height: "1em", verticalAlign: "middle", marginLeft: "4px" }}
      onError={onImageError}
    />
  );

  const getTokenReward = (i) => {
    if (i === 0) return <>14x {renderToken()}</>;
    if (i === 1) return <>8x {renderToken()}</>;
    if (i === 2) return <>4x {renderToken()}</>;
    return null;
  };

  return (
    <div className="activity-columns">
      {/* 🟣 Left - Top Voters */}
      <div className="activity-column">
        <div className="activity-header">
          <img
            src={pointerIcon}
            alt="Votes Icon"
            className="activity-icon"
            onError={onImageError}
          />
          <h2>Top 10 Voters</h2>
        </div>
        <ThemeTimer />
        <p className="activity-subtext">Most votes cast this week</p>

        <Dropdown title="Payout Details">
          <ul>
            <li>1st Place: 14 Tokens</li>
            <li>2nd Place: 8 Tokens</li>
            <li>3rd Place: 4 Tokens</li>
          </ul>
        </Dropdown>

        <div className="activity-me-card green-glow">
          <span>Me</span>
          <div className="activity-value value-cta">{myVotes}</div>
        </div>
        <div className="activity-divider"></div>
        {isLoading ? (
          <p>Loading voters...</p>
        ) : (
          <>
            {mergedVoters && mergedVoters?.length > 0 ? (
              <>
                {mergedVoters.map((user, i) => (
                  <div
                    key={user.username + i}
                    className="activity-leaderboard-card"
                  >
                    <div className="rank-badge-wrapper">
                      {i >= 3 && <div className="rank-number">{i + 1}</div>}
                      {i === 0 && (
                        <LazyImage
                          src={
                            "https://d38a0fe14bafg9.cloudfront.net/icons/firstplace.svg"
                          }
                          alt="1st"
                          className="rank-icon"
                        />
                      )}
                      {i === 1 && (
                        <LazyImage
                          src={
                            "https://d38a0fe14bafg9.cloudfront.net/icons/secondplace.svg"
                          }
                          alt="2nd"
                          className="rank-icon"
                        />
                      )}
                      {i === 2 && (
                        <LazyImage
                          src={
                            "https://d38a0fe14bafg9.cloudfront.net/icons/thirdplace.svg"
                          }
                          alt="3rd"
                          className="rank-icon"
                        />
                      )}
                    </div>
                    <div className="user-info">
                      <div className="username-activity">{user.username}</div>
                      {i < 3 && (
                        <div className="token-reward">{getTokenReward(i)}</div>
                      )}
                    </div>
                    <div
                      className={`activity-value ${i < 3 ? "value-green" : ""}`}
                    >
                      {user.count}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="no-activity-data">
                <div className="dashed-box small">
                  <div className="empty-icon">🗳️</div>
                  <p className="main-message">No voters yet this week!</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 🟣 Right - Top Referrers */}
      <div className="activity-column">
        <div className="activity-header">
          <img src={fileIcon} alt="Referrals Icon" className="activity-icon" />
          <h2>Top 10 Referrers</h2>
        </div>
        <ThemeTimer />
        <p className="activity-subtext">
          Users who referred the most new users this week
        </p>

        <Dropdown title="Payout Details">
          <ul>
            <li>1st Place: 14 Tokens</li>
            <li>2nd Place: 8 Tokens</li>
            <li>3rd Place: 4 Tokens</li>
          </ul>
        </Dropdown>

        <div className="activity-me-card yellow-glow">
          <span>Me</span>
          <div className="activity-value value-cta">{myReferrals}</div>
        </div>
        <div className="activity-divider"></div>
        {isLoading ? (
          <p>Loading referrers...</p>
        ) : (
          <>
            {mergedReferrers && mergedReferrers?.length > 0 ? (
              <>
                {mergedReferrers.map((user, i) => (
                  <div
                    key={user.username + i}
                    className="activity-leaderboard-card"
                  >
                    <div className="rank-badge-wrapper">
                      {i >= 3 && <div className="rank-number">{i + 1}</div>}
                      {i === 0 && (
                        <img
                          src="https://d38a0fe14bafg9.cloudfront.net/icons/firstplace.svg"
                          alt="1st"
                          className="rank-icon"
                        />
                      )}
                      {i === 1 && (
                        <img
                          src="https://d38a0fe14bafg9.cloudfront.net/icons/secondplace.svg"
                          alt="2nd"
                          className="rank-icon"
                        />
                      )}
                      {i === 2 && (
                        <img
                          src="https://d38a0fe14bafg9.cloudfront.net/icons/thirdplace.svg"
                          alt="3rd"
                          className="rank-icon"
                        />
                      )}
                    </div>
                    <div className="user-info">
                      <div className="username-activity">{user.username}</div>
                      {i < 3 && (
                        <div className="token-reward">{getTokenReward(i)}</div>
                      )}
                    </div>
                    <div
                      className={`activity-value ${i < 3 ? "value-green" : ""}`}
                    >
                      {user.count}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="no-activity-data">
                <div className="dashed-box small">
                  <div className="empty-icon">👥</div>
                  <p className="main-message">No referrals yet this week!</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Activity;
