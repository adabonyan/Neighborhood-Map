/* Thanks to Andrew Roy Chen for redirecting me to Foursquare and stackoverflow for helping with knockout js*/

window.onscroll = function() {
  if (window.pageYOffset >= $('#navbar').offset().top) {
    $('#navbar').addClass('sticky');
  } else {
     $('#navbar').removeClass('sticky');
  }
};

var address;
var placeOfInterest = {};
var latitude; 
var longitude;
var myLat;
var myLng;
var myLatLng = {}; // holds lat, lng of my location.
var marker;  // map marker for each place of interest
var myMarker;
var arr_nu;
var marker_color;
var spentColor = [];
var infowindow;
var map;

var container = document.getElementById("container");
var entryForm = document.getElementById("entryForm");
var hamburger = document.getElementById("hamburger");
var navbar = document.getElementById("navbar");
var menuList = document.getElementById("menuList");
var viewMapBtn = document.getElementById("viewMapBtn");
var flexContainer = document.getElementById("flexContainer");
var goBackBtn = document.getElementById("goBackBtn");
var moreDetails = document.getElementById("moreDetails");
var myPlace = document.getElementById("myPlace");
var placesOfInterest = document.getElementById("placesOfInterest");
var list = document.getElementById("list");
var listProcess = document.getElementById("listProcess");
var selectPlace = document.getElementById("selectPlace");
var myMap = document.getElementById("map");
var pano = document.getElementById("pano");
var googleDetails = document.getElementById("googleDetails");
var placeDetail = document.getElementById("placeDetail");
var directionPanel = document.getElementById("directionPanel");

//Using knockout js
var ViewModel = function() {  
  this.myPlace = ko.observable();
  this.itemToAdd = ko.observable("");
  this.items = ko.observableArray();
  this.placesOfInterest = ko.observableArray();
  this.selectedInterest = ko.observable();
  this.searchRadius = ko.observable();
  this.selectedPlace = ko.observable("");
  this.query = ko.observable('');
  self = this;

  // Get my location latitude and longitude
  this.getMyLocation = function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        latitude = pos.lat;
        longitude = pos.lng;
        myLat = latitude;
        myLng = longitude;
        myLatLng = {'lat': latitude, 'lng': longitude};

        if (myLat !== undefined && myLng !== undefined) {
          self.myPlace("My current location");
          self.completeMyLocation();          
        } else {
          window.alert("The Geolocation service failed");
          return;
        }
               
      });
    } else {
      window.alert("Your browser doesn\'t support geolocation");
    }
  };  

// Get latitude and longitude from address entered
  this.myPlaceLatLng = function() {
    if (self.myPlace()) {
      address = self.myPlace();    
      // Initialize the Geocoder
      geocoder = new google.maps.Geocoder();
      if (geocoder) {
        geocoder.geocode({
          'address': address
        }, function (results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            name = results[0].formatted_address;
            latitude = results[0].geometry.location.lat();
            longitude = results[0].geometry.location.lng();
            myLatLng = {'lat': latitude, 'lng': longitude};
            
            self.completeMyLocation();            
            self.myPlace("");  // Erase entry

          } else if (status === "ZERO_RESULTS") {
            window.alert ("Unknown address");
          } else {
            window.alert ("The Geolocation service failed");
          }
        });
      }
    } else {
      window.alert ("You can enter you full address & country or click 'yes' above to allow app to determine your location");
    }    
  };

  // Display map
  this.completeMyLocation = function(){
    //Create marker for central location
    map = new google.maps.Map(myMap, {
      zoom: 13,
      center: myLatLng
    });

    marker = new google.maps.Marker({
      map: map,
      draggable: true,
      animation: google.maps.Animation.DROP,
      position: myLatLng,
      title: "My location",
      mapTypeControl: true
    });

    myMarker = marker;

    infowindow = new google.maps.InfoWindow();  
    // Click on point on the map to close infowindow
    map.addListener('click', function() {
      infowindow.close(map, marker);
      map.setCenter(marker.getPosition());
    });

    marker.addListener('click', function() {
      self.populateMyInfoWindow(this, infowindow);
      map.setCenter(marker.getPosition());
    });

    bounds = new google.maps.LatLngBounds();
    // Extend boundaries of map for each marker and display marker    
    marker.setMap(map);
    bounds.extend(marker.position);
    myPlace.setAttribute("class", "hide");
    placesOfInterest.setAttribute("class", "show boxOne");
    list.setAttribute("class", "show boxTwo");
    listProcess.setAttribute("class", "show boxTwo");
  };

  this.populateMyInfoWindow = function (marker, infowindow) {
    infowindow.marker = marker;
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });
    var contentString = "<h4>My location</h4><p>Cooling my head here</p>";
    infowindow.setContent(contentString);   
    infowindow.open(map, marker); 
  };


  //places of interest
  this.addItem = function() {    
    if (self.items().length === 5) {
      window.alert("You have reached your limit. You can no longer add a new place. Click Finish to continue");
      return;
    }
    arr_nu = self.items().length;  //This is the current length of this array before this new push is completed. Value will be the index of new push when completed.
    switch (arr_nu) {
      case 0:
        marker_color = '003399';
        break;
      case 1:
        marker_color = '33cccc';
        break;
      case 2:
        marker_color = 'ff3399';
        break;
      case 3:
        marker_color = 'ff9933';
        break;
      case 4:
        marker_color = '990000';
        break;            
    }   

    spentColor.push(marker_color);  // save color to be used

    var constant = 'https://api.foursquare.com/v2/venues/search?client_id=RATCVBUAFGTEBRLM1BZUIHWMGR42CVTXY5LMFIXJ2TBBZRWF&client_secret=Z1MF1BSANQW0JXHKZN1U5ZYYEMJR2PFCACTOE25COGF2HO05&v=20130815';
    var url = constant + '&ll=' + myLatLng.lat + ',' + myLatLng.lng + '&radius=' + self.searchRadius() + '&query=' + self.itemToAdd() + '&limit=' + 10;

    $(function() {
      $.ajax({
        url: url,
        dataType: 'jsonp',
        success: function(data) {
          //console.log(data.response.venues);
          var nu = data.response.venues.length;
          if (data.response.venues === 'undefined' || nu === 0) {
            self.itemToAdd(""); // Clears the interest field
            window.alert("There was error searching for "  + self.itemToAdd() + "Please modify your search word(s)");
            return;
          }

          var id = self.itemToAdd();
          var i;          
          for (i = 0; i < nu; i++) {
            var name = data.response.venues[i].name;
            var formattedAddress = data.response.venues[i].location.formattedAddress;            
            var len = formattedAddress.length;
            var n, address = "";

            if (len > 0) {
              for (n = 0; n < len; n++) {
                address += formattedAddress[n] + ' ';
              }
            } else {
              address = "Address UNKNOWN";
            }            

            var contact = data.response.venues[i].contact;
            len = contact.length;
            var contactDetail = '';
            if (len > 0) {
              len = contact.length;
              for (n = 0; n < len; n++) {
                contactDetail += contact[n] + ' ';
              }
            }
            
            var latitude = data.response.venues[i].location.lat;
            var longitude = data.response.venues[i].location.lng;
            var position = {'lat': latitude, 'lng': longitude};        
            var distance = data.response.venues[i].location.distance;
            
            var title, dist;
            if (distance !== '' || distance !== NaN) {
              dist  = (distance * 0.000621371).toFixed(2);
              title = name + " --- " + dist + " miles" + " --- " + (distance/1000).toFixed(2) + " Km";
            } else {
            title = name + " -- Distance UNKNOWN";
            }

            var dataId = data.response.venues[i].id;  //for future
            var url = data.response.venues[i].url;
            var checkinsCount = data.response.venues[i].stats.checkinsCount;
            var tipCount = data.response.venues[i].stats.tipCount;
            var usersCount = data.response.venues[i].stats.usersCount;

            placeOfInterest = {
              "name": name,
              "address": address,
              "lat": latitude,
              "lng": longitude,
              "position": position,
              "contact": contactDetail,
              "url": url,
              "distance": distance,
              "title": title,
              "id": id,
              "dataId": dataId,
              "checkinsCount": checkinsCount,
              "tipCount": tipCount,
              "usersCount": usersCount,
              "index": arr_nu,
              "icon": marker_color
            };

            placeOfInterest.icon = marker_color;
            placeOfInterest.marker = self.createPlaceMarker(placeOfInterest);
            self.placesOfInterest.push(placeOfInterest);
          }          
          self.items.push(self.itemToAdd());
          self.itemToAdd(""); //Clears the field
        },
        error: function(err) {
          window.alert("There was error: "  + err);
          return;
        }        
      });
    });    
  };

  this.createPlaceMarker = function(obj) {
    var position = obj.position;
    var title = obj.name;
    var marker_color = obj.icon;
    var id = obj.id;

    defaultIcon = self.makeMarkerIcon(marker_color);
    marker = new google.maps.Marker({
      title: title,
      position: position,
      map: map,
      icon: defaultIcon,
      animation: google.maps.Animation.DROP
    });

    self.callGoogleMap(obj, marker);
    return marker;    
  };

  this.callGoogleMap = function(obj, marker) {
    google.maps.event.addListener(marker, 'click', function() {
      var contentString = "<div class='infoWindow'><strong> From foursquare.com<br>" + obj.name + "<hr>Address: </strong>" + obj.address + "<br><strong>Distance: </strong>" + obj.distance + "<br><strong>Contact: </strong>" + obj.contact + "<br><strong>Check-ins-Count: </strong>" + obj.checkinsCount + "<br><strong>Users Count: </strong>" + obj.usersCount + "<br><strong>Tip Count: </strong>" + obj.tipCount + "<br><strong>website: </strong><a href='" + obj.url + "' target='_blank'>Visit website</a><hr><strong>From Google Map</strong><br><div id='googleInfo'></div></div>";

      self.getGooglePlaceDetail(obj);
      infowindow.setContent(contentString);
      obj.contentString = contentString;
      infowindow.open(map, marker);
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function(){
        marker.setAnimation(null);
      }, 2000);
    });

    google.maps.event.addListener(infowindow, 'closeclick', function() {
      map.setCenter(myLatLng);
      infowindow.marker = null;
    });
       
    openInfowindow = function(obj) {
      google.maps.event.trigger(obj.marker, 'click');
    };
  };  

  this.makeMarkerIcon = function(markerColor){
    // Create a new marker icon of a given color.
    markerImage = new google.maps.MarkerImage(
      'https://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
      '|40|_|%E2%80%A2',
      new google.maps.Size(21, 34),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(21,34));
    return markerImage;
  };  

  // Delete all places of interest
  this.deleteAllItems = function(){
    self.items([]);  // Or use self.items.removeAll();
    self.placesOfInterest([]);
  };
  
  // Display map with markers
  this.showListings = function(){
    var len = self.items().length;
    var innerHTML = '';
    var colorNote = document.getElementById('colorNote');    
    
    switch (len) {
      case 1:
        innerHTML = '<button class="colorNoteBtn" style="background-color: #' + spentColor[0] + ';"></button>' + ' ' + self.items()[0];
        break;

      case 2:
        innerHTML = '<button class="colorNoteBtn" style="background-color: #' + spentColor[0] + ';"></button>' + ' ' + self.items()[0] + ' ' + '<button class="colorNoteBtn" style="background-color: #' + spentColor[1] + ';"></button>' + ' ' + self.items()[1];
        break;

      case 3:
        innerHTML = '<button class="colorNoteBtn" style="background-color: #' + spentColor[0] + ';"></button>' + ' ' + self.items()[0] + ' ' + '<button class="colorNoteBtn" style="background-color: #' + spentColor[1] + ';"></button>' + ' ' + self.items()[1] + ' ' + '<button class="colorNoteBtn" style="background-color: #' + spentColor[2] + ';"></button>' + ' ' + self.items()[2];
        break;

      case 4:
        innerHTML = '<button class="colorNoteBtn" style="background-color: #' + spentColor[0] + ';"></button>' + ' ' + self.items()[0] + ' ' + '<button class="colorNoteBtn" style="background-color: #' + spentColor[1] + ';"></button>' + ' ' + self.items()[1] + ' ' + '<button class="colorNoteBtn" style="background-color: #' + spentColor[2] + ';"></button>' + ' ' + self.items()[2] + ' ' + '<button class="colorNoteBtn" style="background-color: #' + spentColor[3] + ';"></button>' + ' ' + self.items()[3];
        break;

      case 5:
        innerHTML = '<button class="colorNoteBtn" style="background-color: #' + spentColor[0] + ';"></button>' + ' ' + self.items()[0] + ' ' + '<button class="colorNoteBtn" style="background-color: #' + spentColor[1] + ';"></button>' + ' ' + self.items()[1] + ' ' + '<button class="colorNoteBtn" style="background-color: #' + spentColor[2] + ';"></button>' + ' ' + self.items()[2] + ' ' + '<button class="colorNoteBtn" style="background-color: #' + spentColor[3] + ';"></button>' + ' ' + self.items()[3] + ' ' + '<button class="colorNoteBtn" style="background-color: #' + spentColor[4] + ';"></button>' + ' ' + self.items()[4];
        break;
    }

    colorNote.innerHTML = innerHTML;
    colorNote.style.display = "block";

    self.placesOfInterest().forEach(function(place) {
      place.marker.setMap(map);
      bounds.extend(place.marker.position);
    });

    map.setCenter(myLatLng);
    map.fitBounds(bounds);
    
    viewMapBtn.style.display = "inline-block";
    hamburger.setAttribute("class", "hamburger");
    selectPlace.setAttribute("class", "show boxOne");
    myPlace.setAttribute("class", "hide");
    placesOfInterest.setAttribute("class", "hide");
    list.setAttribute("class", "hide");
    listProcess.setAttribute("class", "hide");
    viewMap();
  };

  this.goBack = function() {
    self.removePath();
    myMarker.setMap(map);
    bounds.extend(myMarker.position);

    var objs = self.placesOfInterest();
    var nu = objs.length
    var el = $('#placesUL li');

    for (i = 0; i < nu; i++) {
      objs[i].marker.setMap(map);
      bounds.extend(objs[i].marker.position);
      bounds.extend(objs[i].marker.position);
      objs[i].marker.setVisible(true);
      el.eq(i).attr('class', 'show');
    }

    map.fitBounds(bounds);    
    $('.searchNote').text('');
    navbar.setAttribute("class", "show navbar");
    menuList.style.display = "none";
    container.setAttribute("class", "show container");
    selectPlace.setAttribute("class", "show boxOne");    
    moreDetails.style.display = "none";
    placeDetail.innerHTML = "";
    directionPanel.innerHTML = "";
    googleDetails.setAttribute("class", "hide");
    flexContainer.setAttribute("class", "hide");
    myMap.style.zIndex = "-1";
    infowindow.close(map, marker);    
    map.setCenter(myLatLng);    
  };
    
  this.search = function() {
    var nu = self.query().length;
    if(nu > 2) {
      var str = self.query().toLowerCase();
      infowindow.close(map, marker);
      var objs = self.placesOfInterest();
      var no = objs.length
      var i, obj_str;
      var el = $('#placesUL li');
      for (i = 0; i < no; i++) {
        obj_str = objs[i].name.toLowerCase();
        if (!obj_str.includes(str)) {
          objs[i].marker.setVisible(false);
          infowindow.close(map, marker);
          el.eq(i).attr('class', 'hide');
        } else {
          objs[i].marker.setVisible(true);
          el.eq(i).attr('class', 'show');
        }
      }     
      self.query('');
      $('.searchNote').text('Click on a place of interest to get information and direction or open map to view search result');
    }    
  };
  
  this.display = function() {
    var context = ko.contextFor(event.target);
    var res = (context.$index());
    var nu = self.placesOfInterest().length;
    var i;
    var objs = self.placesOfInterest();

    for (i = 0; i < nu; i++) {
      if (i !== res) {
        objs[i].marker.setMap(null);
      } else {
        google.maps.event.trigger(objs[i].marker, 'click');
        var obj = objs[i];
        self.getPano(obj);
        self.getGooglePlaceDetail(obj);
        self.getDirection(obj);
        moreDetails.style.display = "inline-block";
      }
    }
    viewMap();
  };

  this.getPano = function(obj) {
    var panorama = new google.maps.StreetViewPanorama(
      pano, {
      position: obj.position,
      pov: {heading: 165, pitch: 0},
      zoom: 1
    });
  };
  
  this.getGooglePlaceDetail = function (obj) {
    var query = obj.name + " " + obj.address;
    var placesService = new google.maps.places.PlacesService(map);
    placesService.textSearch({
      query: query,
    }, function(results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {     
        self.getPlaceDetail(results);
      } else {
        innerHTML = "We could not find details e.g. opening hours, etc. for this place";
        $('#googleInfo').html(innerHTML);
        placeDetail.innerHTML = innerHTML;
      }
    });
  };

  // Display more details about a place.
  this.getPlaceDetail = function (results) {
    placeId = results[0].place_id;
    var service = new google.maps.places.PlacesService(map);
    service.getDetails({
      placeId: placeId
    }, function(place, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        var innerHTML = '';
        if (place.name) {
          innerHTML += '<strong>' + place.name + '</strong>';
        }
        if (place.formatted_address) {
          innerHTML += '<br>' + place.formatted_address;
        }
        if (place.formatted_phone_number) {
          innerHTML += '<br>' + place.formatted_phone_number;
        }
        if (place.opening_hours) {
          innerHTML += '<br><br><strong>Hours:</strong><br>' +
              place.opening_hours.weekday_text[0] + '<br>' +
              place.opening_hours.weekday_text[1] + '<br>' +
              place.opening_hours.weekday_text[2] + '<br>' +
              place.opening_hours.weekday_text[3] + '<br>' +
              place.opening_hours.weekday_text[4] + '<br>' +
              place.opening_hours.weekday_text[5] + '<br>' +
              place.opening_hours.weekday_text[6];
        }
        if (place.photos) {
          innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
              {maxHeight: 100, maxWidth: 200}) + '">';
        }
        $('#googleInfo').html(innerHTML);
        placeDetail.innerHTML = '<div>' + innerHTML + '</div>';
      }
    });
  };
  
  this.getDirection = function(obj) {
    directionsDisplay = new google.maps.DirectionsRenderer;
    directionsService = new google.maps.DirectionsService;
    
    map = new google.maps.Map(myMap, {
      zoom: 13,
      center: myLatLng,
      mapTypeControl: false
    });

    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(directionPanel);
    var origin = myLatLng;
    var destination = obj.position;    
    mode = 'DRIVING';
    directionsService.route({
      origin: origin,
      destination: destination,
      travelMode: mode
    }, function(response, status) {
      if (status === 'OK') {
        directionsDisplay.setDirections(response);
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    });
  };

  this.removePath = function() {
    directionsDisplay = new google.maps.DirectionsRenderer;
    directionsService = new google.maps.DirectionsService;
    
    map = new google.maps.Map(myMap, {
      zoom: 13,
      center: myLatLng,
      mapTypeControl: false
    });

    directionsDisplay.setMap(null);
  };

  this.moreDetails = function() {
    navbar.setAttribute("class", "show navbar");
    container.setAttribute("class", "show container");
    selectPlace.setAttribute("class", "hide");
    myMap.style.zIndex = "-1";
    googleDetails.setAttribute("class", "show");
  };
  
}.bind(this);

ko.applyBindings(new ViewModel());

function menuToggle() {
  if (menuList.style.display === "none") {
    menuList.style.display = "block";
  } else {
    menuList.style.display = "none";
  }
}

function viewMap() {
  navbar.setAttribute("class", "hide");
  container.setAttribute("class", "hide");
  myMap.style.zIndex = "1";
  flexContainer.setAttribute("class", "flexContainer");
}
