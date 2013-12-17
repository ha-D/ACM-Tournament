$(function() {
  
  var results = [[ /* WINNER BRACKET */
      [["-","-"], ["-","-"], ["-","-"], ["-","-"], ["-","-"], ["-","-"], ["-","-"], ["-","-"]],
      [["-","-"], ["-","-"], ["-","-"], ["-","-"]],
      [["-","-"], ["-","-"]],
      [["-","-"]]
    ], [          /*LOSER BRACKET */
      [["-","-"], ["-","-"], ["-","-"], ["-","-"]],
      [["-","-"], ["-","-"], ["-","-"], ["-","-"]],
      [["-","-"], ["-","-"]],
      [["-","-"], ["-","-"]],
      [["-","-"]],
      [["-","-"]]
    ], [         /* FINALS */
      [["-","-"]]
  ]];

  var teams = [
        [{name: "s1", flag: 'fi'}, {name: "t1", flag: 'kr'}],
        [{name: "s2", flag: 'se'}, {name: "t2", flag: 'us'}],
        [{name: "s3", flag: 'fi'}, {name: "t3", flag: 'kr'}],
        [{name: "s4", flag: 'se'}, {name: "t4", flag: 'us'}],
        [{name: "s5", flag: 'fi'}, {name: "t5", flag: 'kr'}],
        [{name: "s6", flag: 'se'}, {name: "t6", flag: 'us'}],
        [{name: "s7", flag: 'fi'}, {name: "t7", flag: 'kr'}],
        [{name: "s8", flag: 'se'}, {name: "t8", flag: 'us'}]
  ]

  var matches;
  var currentMatch = 0;
  var selectedMatch = 0;
  var nextTeamMatch = []

  var minimalData = {
    teams : teams,
    results : results
  }

  function get_team_by_id(team_id) {
    return teams[Math.floor(team_id/2)][team_id%2];
  }

  function get_team_id(team_name) {
    for(var i = 0; i < teams.length; i++){
      if(teams[i][0].name == team_name)
        return i * 2;
      if(teams[i][1].name == team_name)
        return i * 2 + 1;
    }
  }

  function edit_fn(container, data, doneCb) {
    // console.log(data);
  }

  function render_fn(container, data, score) {
    if (!data.flag || !data.name)
      return
    container.append('<img wdith="15px" height="15px" src="img/'+data.flag+'.jpg" /> ').append(data.name)
  }

  function GameMatch(game_number, team1, team2, round, state, ind, score1, score2, trace_file) {
    this.game_number = game_number;
    this.team1 = team1;
    this.team2 = team2;
    this.round = round;
    this.state = state;
    this.ind = ind;
    this.score1 = score1;
    this.score2 = score2;
    this.played = false;
    this.trace_file = trace_file;
  }

  function parse_result_data(data) {
    var matches = [];
    var lines = data.split("\n");
    var lastRound = -1;
    var lastState = -1;
    var ind = -1;
    for(var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var re = /(\d)\s+(\d)\s+(\w+)\s+(\w+)\s+\[(\d+),\s*(\d+)\]\s+(\w+)\s+(\w+)\s+((?:\w|[.])+)\s*/g;
      var match = re.exec(line);
      if(match == null)
        continue;
      if(match[2] == lastRound && match[1] == lastState){
        ind++;
      }else{
        ind = 0;
        lastRound = match[2];
        lastState = match[1];
      }
      var match = new GameMatch(i, get_team_id(match[3]), get_team_id(match[7]), match[1], match[2], ind, match[5], match[6], match[9]);
      matches.push(match);
    }
    return matches;
  }

  function apply_bracket(){
    $('.demo').bracket({
      init: minimalData /* data to initialize the bracket with */,
          skipConsolationRound: true,
          skipSecondaryFinal: true,
          decorator: {edit: edit_fn, render: render_fn},
    })
  }

  function init(){
    apply_bracket();
    $('.game').hide();
    $(".sidebar").sidebar();
    $(".sidebar").sidebar('toggle');
    $.get("result.txt",function(data,status){
      matches = parse_result_data(data);
      var i = 0;
      while(matches[i].round == 0){
        nextTeamMatch[matches[i].team1] = i;
        nextTeamMatch[matches[i].team2] = i;
        i++;
      }
      update_versus();
      push_state();
    });
  }

  function match_ready(match){
    return nextTeamMatch[match.team1] == match.game_number && nextTeamMatch[match.team2] == match.game_number;
  }

  function update_next_match(teamid){
    for(var i = 0; i < matches.length; i++){
      var match = matches[i];
      if(match.played)
        continue;
      if(match.team1 == teamid || match.team2 == teamid){
        nextTeamMatch[teamid] = i;
        return;
      }
    }
  }

  function update_versus(bypass){
    var match = matches[selectedMatch];
    var ready = true;
    if(bypass){
      $("#team1").html(get_team_by_id(match.team1).name);
      $("#team2").html(get_team_by_id(match.team2).name);
    }else {
      if(nextTeamMatch[match.team1] == match.game_number){
        $("#team1").html(get_team_by_id(match.team1).name);
      }else{
        $("#team1").html("?");
        ready = false;
      }

      if(nextTeamMatch[match.team2] == match.game_number){
        $("#team2").html(get_team_by_id(match.team2).name);
      }else{
        $("#team2").html("?");
        ready = false;
      }
    }

    if(match.played){
      $("#skip").addClass("disabled");
      $("#play").removeClass("disabled");
      // $("#status").html("Game already played");
    }else if(ready){
      $("#skip").removeClass("disabled");
      $("#play").removeClass("disabled");
      // $("#status").html("Ready to play");
    }else{
      $("#skip").addClass("disabled");
      $("#play").addClass("disabled");
      // $("#status").html("Game not ready");
    }
  }

  $("body").on("click", ".team", function(){
    if($(this).find(".score").text().trim() != "--") {
      var team1 = $(this).attr("data-teamid");
      var team2 = $($(this).siblings()[0]).attr("data-teamid");
      for(var i = 0; i < matches.length; i++) {
        if((matches[i].team1 == team1 && matches[i].team2 == team2) ||
          (matches[i].team1 == team2 && matches[i].team2 == team1)){
          selectedMatch = i;
          update_versus(true);
          return;
        }
      }
    }
    var teamid1 = $(this).attr("data-teamid");
    if(teamid1 == -1)
      return;

    var match = matches[nextTeamMatch[teamid1]];
    selectedMatch = match.game_number;
    update_versus();
  })

  function nextGame(){
    for(var i = 0; i < matches.length; i++) {
      if(!matches[i].played){
        selectedMatch = i;
        break;
      }
    }
    update_versus();
  }

  window.addEventListener("popstate", function(e) {
    var state = e.state;
    if(state != null){
      if(state.state_type == "match"){
        for(var i = 0; i < results.length; i++){
          for(var j = 0; j < results[i].length; j++){
            for(var k = 0; k < results[i][j].length; k++){
              results[i][j][k] = state.results[i][j][k];
            }
          }
        }

        for(var i = 0; i < matches.length; i++){
          matches[i].played = state.played[i];
        }

        currentMatch = state.currentMatch;

        for(var i = 0; i < state.nextTeamMatch.length; i++){
          nextTeamMatch[i] = state.nextTeamMatch[i];
        }

        update_next_match();
        nextGame();
        apply_bracket();

        if(page == "game")
          show_tournament();
      }else if(state.state_type == "show"){
        var match = matches[state.match_id];
        show_game(match);
      }
    }
  });

  function push_state(){
    played = []
    for(var i = 0; i < matches.length; i++)
      played.push(matches[i].played);
    history.pushState({state_type:"match", results: results.slice(0), played: played, currentMatch: currentMatch, nextTeamMatch: nextTeamMatch.slice(0)}, null, null);
  }

  function play(){
    var match = matches[selectedMatch];
    if(!match.played && !match_ready(match)){
      return;
    }

    match.played = true;
    var round = match.round;
    var state = match.state;

    var prev_state;
    // update result array
    if(state == 0) {
      prev_state = { state: 0, round: round, ind: match.ind, val: results[0][round][match.ind]};
      results[0][round][match.ind] = [match.score1, match.score2];
    }else if(state == 1) {
      prev_state = { state: 1, round: (round - 1)*2, ind: match.ind, val: results[1][(round - 1)*2][match.ind]};
      results[1][(round - 1)*2][match.ind] = [match.score1, match.score2];
    }else if(state == 2) {
      prev_state = { state: 1, round: (round - 1)*2 + 1, ind: match.ind, val: results[1][(round - 1)*2 + 1][match.ind]};
      results[1][(round - 1)*2 + 1][match.ind] = [match.score1, match.score2];
    }else if(state == 3) {
      prev_state = { state: 2, round: 0, ind: match.ind, val: results[2][0][match.ind]};
      results[2][0][match.ind] = [match.score1, match.score2];
    }

    // update brackets
    apply_bracket();

    // update versus
    update_next_match(match.team1);
    update_next_match(match.team2);


    currentMatch++;
    while(currentMatch < matches.length - 1 && matches[currentMatch].played)
      currentMatch++;

    // update history
    push_state();
   

    return match;
  }

  $("body").on("click", "#skip", function(){
    if($(this).hasClass("disabled"))
      return;
    play();
    nextGame();
    update_versus();
  })

  var page = "game";
  function show_game(match){
    $("#dimmer").dimmer('show');
    setTimeout(function(){
      $(".demo").hide();
      if(match === undefined)
        match = play();
      var applet = document.createElement("applet");
      applet.setAttribute("id","game-applet");
      applet.setAttribute("archive","coderunner.jar");
      applet.setAttribute("code","icpc.challenge.view.PlayerApplet");
      applet.setAttribute("width","950");
      applet.setAttribute("height","650");

      var param1 = document.createElement("param");
      param1.setAttribute("name", "traceFile");
      param1.setAttribute("value", "logs/"+match.trace_file);
      applet.appendChild(param1);

      var param2 = document.createElement("param");
      param2.setAttribute("name", "redPart");
      param2.setAttribute("value", get_team_by_id(match.team1).name);
      applet.appendChild(param2);

      var param3 = document.createElement("param");
      param3.setAttribute("name", "bluePart");
      param3.setAttribute("value", get_team_by_id(match.team2).name);
      applet.appendChild(param3);

      $(".game")[0].appendChild(applet);        
      $(".game").show();
      $("#skip").addClass("disabled");
      $("#play").addClass("disabled");
      $("#dimmer").dimmer('hide');

      page = "game";
     // history.push_state({state_type: "show", match_id: match.game_number}, null, null);
    }, 500)
  }

  function show_tournament(){
    $("#dimmer").dimmer('show');
    setTimeout(function(){
      nextGame();
      $("#game-applet").remove();
      $(".game").hide();
      if(currentMatch < matches.length - 1){
        $("#skip").removeClass("disabled");
        $("#play").removeClass("disabled");
      }
      $(".demo").show();
      $("#dimmer").dimmer('hide');
      page = "tournament";
    }, 500);
  }

  $("body").on("click", "#play", function(){
    if($(this).hasClass("disabled"))
      return;
    show_game();
  })

  $("body").on("click", "#tablebtn", function(){
    show_tournament();
    history.back();
  });

  init();
})
