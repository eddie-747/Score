import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
    stages: [
       { duration: '10s', target: 1 }, // Ramp up to 10 virtual users in 10 seconds
       { duration: '30s', target: 1 }, // Stay at 10 virtual users for 30 seconds
       { duration: '10s', target: 0 }   // Ramp down to 0 virtual users in 10 seconds
    ]
};

// API parameters
const API_URL = 'http://lookup-service-prod.mlb.com/json/named.';
const SPORT_CODE = "'mlb'";
const SEASON = "'2017'";
const GAME_TYPE = "'R'";

export default function () {
    // Fetch player scoring stats
    let playerResponse = http.get(API_URL + 'leader_hitting_repeater.bam?sport_code=' + SPORT_CODE + '&results=10&game_type=' + GAME_TYPE + '&season=' + SEASON +"&sort_column='ab'&leader_hitting_repeater.col_in=ab");
    if (playerResponse.status !== 200) {
        console.error("Failed to fetch player data:", playerResponse.status);
        return;
    }
    let playerData = JSON.parse(playerResponse.body).leader_hitting_repeater.leader_hitting_mux.queryResults.row;

    // Fetch team scoring stats
    let teamResponse = http.get(API_URL + 'team_all_season.bam?sport_code=' + SPORT_CODE +"&all_star_sw='N'&sort_order=name_asc&season=" + SEASON);
    if (teamResponse.status !== 200) {
        console.error("Failed to fetch team data:", teamResponse.status);
        return;
    }
    let teamData = JSON.parse(teamResponse.body).team_all_season.queryResults.row;

    // Analyze and display top 10 players
    if (playerData.length === 0) {
        console.warn("No player data available.");
    } else {
        let topTenIndividuals = playerData.sort((a, b) => parseInt(b.ab) - parseInt(a.ab)).slice(0, 10);
        console.log("Top 10 Players:");
        topTenIndividuals.forEach(player => {
            console.log(player.player_first_last +'\t'+ player.ab);
        });
    }

    console.log('\n');
    console.log('**************************');
    console.log('\n');

    // Analyze and display top 10 teams
    if (teamData.length === 0) {
        console.warn("No team data available.");
    } else {
        let topTenTeams = teamData.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 10);
        console.log("Top 10 Teams:");
        topTenTeams.forEach(team => {
            console.log(team.name +'\t'+team.division_id);
        });
    }

    sleep(1); // Sleep for 1 second before the next iteration
}
