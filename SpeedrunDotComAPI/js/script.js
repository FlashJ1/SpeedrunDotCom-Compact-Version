let gameID;
let time;
let wrVideo;
let select = document.getElementById("categorySelect");
let varDiv;
let flag;

async function searchGame()
{

    let userGame = document.getElementById("gameSearch").value.toLowerCase();

    const gameAPI = await fetch(`https://www.speedrun.com/api/v1/games?name=${userGame}`)

    const data = await gameAPI.json();

    let currGame = data.data.find(g => g.names.international.toLowerCase() == userGame);

    if (!currGame) {
    console.log("Гру не знайдено!");
    return;
  }

    

    select.innerHTML = "";

    document.querySelectorAll('[id$="-variables"]').forEach(div => div.remove());


    gameID = currGame.id;

    const categoryAPI = await fetch(`https://www.speedrun.com/api/v1/games/${gameID}/categories`);

    const categoryData = await categoryAPI.json();

    for (let category of categoryData.data)
    {
        if (category.type == "per-game")
        {
            let option = document.createElement("option");
            option.value = category.id;
            option.text = category.name;
            select.appendChild(option);

            varDiv = document.createElement("div");
            varDiv.id = `${category.id}-variables`;
            varDiv.style.display = "none";
            document.getElementById("subCategories").appendChild(varDiv);

            
            const variablesAPI = await fetch(`https://www.speedrun.com/api/v1/categories/${category.id}/variables`);
            const variablesData = await variablesAPI.json();

            for (let i = 0; i < variablesData.data.length; i++)
            {
                variable = variablesData.data[i];

                let subSelect = document.createElement("select");
                subSelect.id = variable.id;
                subSelect.name = variable.name;

                let emptyOpinion = document.createElement("option");
                emptyOpinion.value = "";
                emptyOpinion.text = `${variable.name}: Empty`;
                subSelect.appendChild(emptyOpinion);

                for (let [valueId, valueName] of Object.entries(variable.values.choices))
                {
                    
                    let option = document.createElement("option");
                    option.value = `var-${variable.id}=${valueId}`;
                    option.text = `${variable.name}: ${valueName}`;
                    subSelect.appendChild(option);

                }

                subSelect.addEventListener('change', getLeaderboard);

                varDiv.appendChild(subSelect);
            }
        }
        
    }

    select.onchange = () =>
    {
        const allVarDivs = document.querySelectorAll("[id$='variables']");
        allVarDivs.forEach(d => d.style.display = "none");

        const selectedDiv = document.getElementById(`${select.value}-variables`);
        if (selectedDiv) selectedDiv.style.display = "block";

        getLeaderboard();


    };

    
    if (select.options.length > 0)
    {
        select.value = select.options[0].value;
        select.onchange();
        getLeaderboard();
    }


    let gameCover = document.getElementById("gameCover");

    let gameName = document.getElementById("gameName");

    gameName.innerHTML = currGame.names.international;

    gameCover.src = currGame.assets["cover-large"].uri
    gameCover.style.opacity = 1;

    select.style.display = "block";
}

async function getLeaderboard()
{

    let categoryID = select.value;

    let varDiv = document.getElementById(`${categoryID}-variables`);

    let queryParams = [];

    if (varDiv)
    {
        let varSelects = varDiv.querySelectorAll("select");
        varSelects.forEach(sel =>
        {
            if (sel.value)
            {
                queryParams.push(sel.value);
            }
        })
    }

    let leaderboardUrl = `https://www.speedrun.com/api/v1/leaderboards/${gameID}/category/${categoryID}`;

    if (queryParams.length > 0)
        {
            leaderboardUrl += "?" + queryParams.join("&");
        }

    const leaderboardAPI = await fetch(leaderboardUrl);

    const leaderboardData = await leaderboardAPI.json();

    if (leaderboardData.data.runs[0].run.videos && leaderboardData.data.runs[0].run.videos.links && leaderboardData.data.runs[0].run.videos.links.length > 0)
    {
        let url = leaderboardData.data.runs[0].run.videos.links[0].uri;

        

        console.log("Фінальний URL:", url);

        let videoID;

        if (url.includes("youtu.be/"))
        {
            videoID = url.split("youtu.be/")[1];
        }

        else if (url.includes("watch?v="))
        {
            videoID = url.split("v=")[1];
            videoID = videoID.split("&")[0];
        }

        let embedURL = `https://www.youtube.com/embed/${videoID}`;

        let gameBody = document.getElementById("gameBody");

        let oldVideo = document.getElementById("wrVideo");
        if (oldVideo)
        {
            oldVideo.remove();
        }

        wrVideo = document.createElement("iframe");
        wrVideo.id = "wrVideo";

        wrVideo.src = embedURL;
        wrVideo.width = "50%";
        wrVideo.height = "500px";

        gameBody.appendChild(wrVideo);
    }

    else
    {
        alert("This run doesn't have video!");
    }

    let username = document.getElementById("lbUsername");

    let userID = leaderboardData.data.runs[0].run.players[0].id;

    const UserAPI = await fetch(`https://www.speedrun.com/api/v1/users/${userID}`);

    const userData = await UserAPI.json();

    username.innerHTML = userData.data.names.international;

    if (userData.data.location && userData.data.location.country)
    {
        let oldFlag = document.getElementById("flagIMG");
        if (oldFlag)
        {
            oldFlag.remove();
        }
        flag = document.createElement("img");
        flag.id = "flagIMG"
        let flagCode = userData.data.location.country.code;
        flagCode = flagCode.replace("/", "-");
        flag.src = `https://flagcdn.com/h40/${flagCode}.png`

        let userBody = document.getElementById("user");
        userBody.appendChild(flag);
    }

    else
    {
        flag.remove();
    }

    

    time = leaderboardData.data.runs[0].run.times.primary_t;

    let currTime = timeConventer(time);

    let lbTime = document.getElementById("lbTime");

    lbTime.innerHTML = currTime;
}

function timeConventer(t)
{
    let hours = Math.floor(t / 3600)
    let minutes = Math.floor((t % 3600) / 60);
    let seconds = Math.floor(t % 60);
    let milliseconds = Math.round((t % 1) * 1000);

    let formattedHours = String(hours).padStart(2, "0");
    let formattedMinutes = String(minutes).padStart(2, "0");
    let formattedSeconds = String(seconds).padStart(2, "0");
    let formattedMilliseconds = String(milliseconds).padStart(3, "0");

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}:${formattedMilliseconds}`
}