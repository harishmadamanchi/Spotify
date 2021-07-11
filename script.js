let clientId = "40c41d6d7e3445f2bf45542ba3b75b7c";
let clientSecret = "2c9ea6aa0e6c4f399b666b7defa78b94";
let code;
let ACCESS_TOKEN;
let REFRESH_TOKEN;
let USER_ID;

const onPageLoad = () => {
    clientId = "40c41d6d7e3445f2bf45542ba3b75b7c";
    clientSecret = "2c9ea6aa0e6c4f399b666b7defa78b94";
    if( window.location.search.length > 0){
        handleRedirect();
    }
}

const handleRedirect = () => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    // console.log(urlParams.get('code'));
    code = urlParams.get('code');
    if(code){
        // console.log("none");
        let login_container = document.getElementById('mainSection');
        login_container.style.height = "0vh";
        login_container.style.display = "block";
        login_container.style.display = "none";
    }
    if(code && REFRESH_TOKEN){
        // console.log("Handle Redirect: ",code,REFRESH_TOKEN)
        getAccessTokenwithRefreshToken(REFRESH_TOKEN)
    }
    else {
        getAccessToken(code);
    }
}


// to get ACCESS_TOKEN and REFRESH_TOKEN and USER_DETAILS
const getAccessToken = async(code) => {
    try {
        const ACCESS_TOKEN_URI = `https://accounts.spotify.com/api/token`;
        // const body_request = "grant_type=authorization_code&code="+code+"&redirect_uri=http://127.0.0.1:5500/index.html"; 
        const body_request = "grant_type=authorization_code&code="+code+"&redirect_uri=https://harishmadamanchi.github.io/Spotify/index.html"
        // console.log('body',body_request);
        const response = await fetch(ACCESS_TOKEN_URI,{
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
            },
            body:body_request
        });
        const jsonData = await response.json();
        // console.log(jsonData);
        if(jsonData.error === "invalid_grant"){
            throw "invalid_grant";
        }
        ACCESS_TOKEN = jsonData.access_token;
        REFRESH_TOKEN = jsonData.refresh_token;
        const GET_USERDETAILSURI = `https://api.spotify.com/v1/me`;
        const userDetailResponse = await fetch(GET_USERDETAILSURI, {
            method: 'GET',
            headers: {
                "content-Type": "application/json",
                Authorization: "Bearer " + ACCESS_TOKEN
            }
        })
        const userDetailJson = await userDetailResponse.json();
        USER_ID = userDetailJson.id;
        getPlaylistOfUser();
    } catch (error) {
        if(error === "invalid_grant"){
            // window.alert('Your session got ended');
            // window.location.href = 'http://127.0.0.1:5500/index.html';
            authorizeUser();
        }
    }   
}

// to get the PLAYLISTS Of User
const getPlaylistOfUser = async() => {
    try {
        const PLAYLIST_URI = 'https://api.spotify.com/v1/me/playlists?limit=10';
        const playlistResponse = await fetch(PLAYLIST_URI, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization : "Bearer " + ACCESS_TOKEN
            }
        });
        const playlistJson = await playlistResponse.json();
        // if(playlistJson.error )  
        if(playlistJson.error){
            throw 'Access Token Expired';
        }
        loadUserPlaylist(playlistJson);
    } catch (error) {
        // console.log(error);
        if(error === 'Access Token Expired'){
            getAccessTokenwithRefreshToken(REFRESH_TOKEN);
        }
    }
}

// load PLAYLIST to UI
const loadUserPlaylist = (playlistJson) => {
    const rowContainer = document.getElementById('containerRow');
    rowContainer.innerHTML = '';
    const numOfPlaylists = playlistJson.items;
    console.log(numOfPlaylists);

    numOfPlaylists.forEach(async(element) => {

        const CHECK_FOLLOW = `https://api.spotify.com/v1/playlists/${element.id}/followers/contains?ids=${USER_ID}`;
        const checkFollow = await fetch(CHECK_FOLLOW,{
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                Authorization : "Bearer " + ACCESS_TOKEN
            }
        });
        const jsonFollow = await checkFollow.json();
        const buttonName = jsonFollow[0] ? 'Unfollow' : 'Follow';
        const Playlistdescription = element.description.length > 0 ? (element.description).substring(0,56) : '</br></br>';
        const eachPlaylistItem = `
        <div class="card">
            <img src="${element.images[0].url}" class="card-img-top" alt="...">
            <div class="card-body">
              <h6 class="card-title font-weight-bold">${element.name}</h6>
              <p class="card-text">${Playlistdescription}</p>
              <button class="btn btn-outline-primary" id ="${element.id +"_follow"}" onclick = MakeFollowUnfollowPlaylist("${element.id}","${buttonName}")>${buttonName}</button>
              <button class="btn btn-info" id ="${element.id + "_GetTracks"}" onclick = GetTracks("${element.id}")>Get Tracks</button>
              <button class="btn btn-info mt-1" id ="${element.id + "_reOrder"}" onclick = ReOrderTracks("${element.id}","${element.snapshot_id}")>Re-Order</button>
              <button class="btn btn-outline-info mt-1" id ="${element.id + "_addSongs"}" onclick = AddSongs("${element.id}","${element.snapshot_id}")>Add Songs</button>
            </div>
        </div>`;
        const column = document.createElement('div');
        column.setAttribute('class','col-12 col-md-3');
        column.innerHTML = eachPlaylistItem;
        rowContainer.append(column);
    });
}

// fetch Add Tracks to PLAYLIST;
const AddSongs = async(playlistID,snapshot_id) => {
    try {
        const access = getAccessTokenwithRefreshToken(REFRESH_TOKEN);
        const SearchURI = `https://api.spotify.com/v1/search?q=feelgood&type=track&limit=10`;
        const searchResp = await fetch(SearchURI, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + ACCESS_TOKEN
            }
        })
        const jsonResp = await searchResp.json();
        // console.log(jsonResp);
        loadSongsTOADD(jsonResp.tracks,playlistID);
    } catch (error) {
        window.alert(error);
    }
}

// load the add tracks to UI
const loadSongsTOADD = (tracksObject,idPlayList) => {
    const trackItems = tracksObject.items;
    let tbody = document.getElementById('tbody');
    tbody.innerHTML = '';
    let i = 1;
    trackItems.forEach(element => {
        const trow = `<td>${i}</td><td>${element.name}</td><td>${element.album.name}</td><td><button class="btn btn-success" onclick = ADDTOPlaylist("${element.uri}","${idPlayList}")>ADD</button</td>`;
        const tr = document.createElement('tr');
        tr.innerHTML = trow;
        tbody.append(tr);
        i++;
    })
}

// ADd song to playlist
const ADDTOPlaylist = async(tracktoAdd,toPlaylist) => {
    const access = await getAccessTokenwithRefreshToken(REFRESH_TOKEN);
    const ADDTOPLAYLISTURI = `https://api.spotify.com/v1/playlists/${toPlaylist}/tracks?uris=${tracktoAdd}`;
    const addResp = await fetch(ADDTOPLAYLISTURI, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            Authorization : "Bearer " + ACCESS_TOKEN
        }
    })
    // console.log(addResp);
    if(addResp.status == 201){
        window.alert('Track is added to Playlist.');
        GetTracks(toPlaylist);
    }
}

// FOLLOW and UNFOLLOW some PLAYLIST
const MakeFollowUnfollowPlaylist = async(playListId, buttonType) => {
    let btn_follow = document.getElementById(playListId+"_follow");
    // console.log(btn_follow)
    const access = await getAccessTokenwithRefreshToken(REFRESH_TOKEN);
    playListId = playListId.trim();
    try {
        const PLAYLIST_FOLLOW_URI = `https://api.spotify.com/v1/playlists/${playListId}/followers`;

        if(buttonType === 'Follow') {
            const playlistResponsefollow = await fetch(PLAYLIST_FOLLOW_URI, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization : "Bearer " + ACCESS_TOKEN
                },
                body: {"public":false}
            });
            console.log('status code',playlistResponsefollow.status);
            if(playlistResponsefollow.status == 200){
                // btn_follow.innerText = 'Unfollow';
                window.alert('Successfully followed the playlist');
                getPlaylistOfUser();
            }
            else{
                window.alert('Please try Again '+playlistResponsefollow.status);
            }
        }
        else if(buttonType === 'Unfollow') {
            const playlistResponseunfollow = await fetch(PLAYLIST_FOLLOW_URI, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization : "Bearer " + ACCESS_TOKEN
                },
                body: {"public":false}
            });
            // console.log('status code',playlistResponseunfollow.status);
            if(playlistResponseunfollow.status == 200){
                // btn_follow.innerText = 'Follow';
                window.alert('Successfully unfollowed the playlist');
                getPlaylistOfUser();
            }
            else{
                window.alert('Please try Again '+playlistResponseunfollow.status);
            }
        }
        
    } catch (error) {
        // console.log(error);  
        window.alert(error);      
    }
}


// TO get the tracks of the particular playlist
const GetTracks = async(idPlayList) => {
    try {
        const access = await getAccessTokenwithRefreshToken(REFRESH_TOKEN);
        const GET_TRACKS_URI = `https://api.spotify.com/v1/playlists/${idPlayList}/tracks?market=IN`;
        const getTracksResp = await fetch(GET_TRACKS_URI, {
            method: 'GET',
            headers: {
            "Content-Type": "application/json",
            Authorization : "Bearer " + ACCESS_TOKEN
            }
        })
        const jsonTracks = await getTracksResp.json();
        // console.log(jsonTracks);
        loadTracks(jsonTracks.items,idPlayList);
    }
    catch (error) {
        // console.log(error);
        window.alert(error);
    }
}

// Load tracks to UI
const loadTracks = (playListTracks,idPlayList) => {
    let tbody = document.getElementById('tbody');
    tbody.innerHTML = '';
    let i = 1;
    console.log(playListTracks);
    playListTracks.forEach(element => {
        const trow = `<td>${i}</td><td>${element.track.name}</td><td>${element.track.album.name}</td><td><button class="btn btn-danger" onclick = RemoveFromPlaylist("${element.track.uri}","${idPlayList}")>Remove</button</td>`;
        const tr = document.createElement('tr');
        tr.innerHTML = trow;
        tbody.append(tr);
        i++;
    })
}

// TO Remove a track from the Particular PLAYLIST
const RemoveFromPlaylist = async(trackUri,idplaylist) => {
    // console.log(`"${trackUri}"`);
    const trackToRemove = `"${trackUri}"`;
    const access = getAccessTokenwithRefreshToken(REFRESH_TOKEN);
    const REMOVE_TRACK_URI = `https://api.spotify.com/v1/playlists/${idplaylist}/tracks`;
    const body_req = {
        "tracks": [
          {
            "uri": trackToRemove,
          }
        ]
      };
    // const StringyBody = await body_req.toStringify();
    const removeResp = await fetch(REMOVE_TRACK_URI, {
        method: 'DELETE',
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + ACCESS_TOKEN
        },
        body: body_req
    })
    const jsonRemove = await removeResp.json();
    console.log(jsonRemove);
}

// to GET ACCESS_TOKEN with REFRESH_TOKEN
const getAccessTokenwithRefreshToken = async(refresh) => {
    const ACCESS_TOKEN_URI = `https://accounts.spotify.com/api/token`;
    const body_request = "grant_type=refresh_token&refresh_token="+refresh; 
    // console.log('body',body_request);
    const response = await fetch(ACCESS_TOKEN_URI,{
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
        },
        body:body_request
    });
    const jsonData = await response.json();
    // console.log(jsonData);
    ACCESS_TOKEN = jsonData.access_token;
    // getPlaylistOfUser();
    return ACCESS_TOKEN;
}

// TO Initailly AUTHORISE USER
const authorizeUser = async() => {
    try {
        // const scopes = "playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative ugc-image-upload";
        const redirect = "https://harishmadamanchi.github.io/Spotify/index.html";
        // const redirect = "http://127.0.0.1:5500/index.html";
        const scopes ="streaming playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-follow-read user-follow-modify user-library-read user-library-modify user-modify-playback-state user-read-recently-played user-read-playback-state user-read-currently-playing user-top-read";
        const AUTHORIZEURI = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirect}&scope=${scopes}`;
        window.location.href = AUTHORIZEURI;    
    } catch (error) {
        // console.log(error);
        window.alert(error);
    } 
}

// On Search of PLAYLISTS
const button_Search = document.getElementById('button-Search');
button_Search.addEventListener('click', () => {
    const inp_search = document.getElementById('inp_search');
    const searchValue = inp_search.nodeValue;
    if(searchValue !== ''){
        getSearchedPlaylist(searchValue);
    }else {
        window.alert('Please enter the playlist');
    }
})

// TO get the Playlist
const getSearchedPlaylist = async(searchedValue) => {
    try {
        const access = getAccessTokenwithRefreshToken(REFRESH_TOKEN);
        const SearchURI = `https://api.spotify.com/v1/search?q=${searchedValue}&type=playlist&limit=10`;
        const searchResp = await fetch(SearchURI, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + ACCESS_TOKEN
            }
        })
        const jsonResp = await searchResp.json();
        console.log(jsonResp);
        loadSearchedPlaylist(jsonResp.playlists);
    } catch (error) {
        // console.log(error);
        window.alert(error);
    }
}

// to display the searched Playlist
const loadSearchedPlaylist = (playlistJson) => {
    const searchedResult = document.getElementById('searchedResult');
    searchedResult.innerHTML = '';
    const numOfPlaylists = playlistJson.items;

    numOfPlaylists.forEach(async(element) => {

        const CHECK_FOLLOW = `https://api.spotify.com/v1/playlists/${element.id}/followers/contains?ids=${USER_ID}`;
        const checkFollow = await fetch(CHECK_FOLLOW,{
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                Authorization : "Bearer " + ACCESS_TOKEN
            }
        });
        const jsonFollow = await checkFollow.json();
        const buttonName = jsonFollow[0] ? 'Unfollow' : 'Follow';
        const Playlistdescription = element.description.length > 0 ? (element.description).substring(0,56) : '</br></br>';
        const eachPlaylistItem = `
        <div class="card mt-2">
            <img src="${element.images[0].url}" class="card-img-top" alt="...">
            <div class="card-body">
              <h6 class="card-title font-weight-bold">${element.name}</h6>
              <p class="card-text">${Playlistdescription}</p>
              <button class="btn btn-outline-primary" id ="${element.id}" onclick = MakeFollowUnfollowPlaylist("${element.id}","${buttonName}")>${buttonName}</button>
              <button class="btn btn-info" id ="${element.id}" onclick = GetTracks("${element.id}")>Get Tracks</button>
            </div>
        </div>`;
        const column = document.createElement('div');
        column.setAttribute('class','col-12 col-md-3');
        column.innerHTML = eachPlaylistItem;
        searchedResult.append(column);
    });
}


// To reorder the tracks in Playlist
const ReOrderTracks = async(playlistID,snapshot_id) => {
    const access = getAccessTokenwithRefreshToken(REFRESH_TOKEN);
    const REORDER_URI = `https://api.spotify.com/v1/playlists/${playlistID}/tracks`;
    const reorderResp = await fetch(REORDER_URI, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json",
            Authorization : "Bearer " + ACCESS_TOKEN
        },
        body:{
            "range_start": 1,
            "insert_before": 5,
            "range_length": 2,
            "snapshot_id": snapshot_id
        }
    })
    console.log(reorderResp);
}

// playlist-modify-public
// playlist-modify-private
// playlist-read-private
// playlist-read-collaborative

// ugc-image-upload