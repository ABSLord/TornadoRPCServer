$(document).ready(function () {

    function runClick(id) {
        debugger;
        RPC.call('docker.run', id).then(
            function (message) {
                alert(message);
                get_images();
                get_containers();
            }, function (error) {
                alert(error);
                get_images();
                get_containers();
            });
    }

    function createImagesList(images) {
        $('#images-list').empty();
        debugger;
        for (var key in images) {
            $('#images-list').append("<a class='list-group-item' data-toggle='list' role='tab' id=" + key + "_" + ">" + images[key] + "<button type='button' style='float: right;' id=" + key + ">Run</button>" + "</a>");

            document.getElementById(key).addEventListener("click", function () {
                runClick(key);
            }, false);
        }
    }

    function createContainersList(containers) {
        $('#containers-list').empty();
        $('#start').prop('disabled', true);
        $('#stop').prop('disabled', true);
        $('#remove').prop('disabled', true);
        $(".panel-heading").text('Choose docker container');
        for (var key in containers) {
            $('#containers-list').append("<a class='list-group-item' data-toggle='list' role='tab' id=" + key + ">" + key + ": " + containers[key] + "</a>");
        }

        $('#containers-list a').each(function (idx, elem) {
            if ($("#containers-pills").find(".active").text() == 'Started' && $(elem).text().includes('stopped')) {
                $(elem).hide();
            }
            else {
                $(elem).show();
            }
        });

        $('#containers-list a').on('click', function () {
            $(".panel-heading").text($(this).text());
            if ($(this).text().includes('stopped')) {
                $('#start').prop('disabled', false);
                $('#stop').prop('disabled', true);
            }
            else {
                $('#stop').prop('disabled', false);
                $('#start').prop('disabled', true);
            }
            $('#remove').prop('disabled', false);
        });

    }

    function get_images() {
        RPC.call('api.get_images').then(createImagesList, function (error) {
            alert(error.type + '("' + error.message + '")');
        }).done();
    }

    function get_containers() {
        RPC.call('api.get_containers').then(createContainersList, function (error) {
            alert(error.type + '("' + error.message + '")');
        }).done();
    }

    $('#start').on('click', function () {
        var id = $(".panel-heading").text().split(': ')[0]
        RPC.call('docker.start', id).then(
            function (message) {
                alert(message);
                get_containers();
            }, function (error) {
                alert(error);
                get_containers();
            });
    });

    $('#stop').on('click', function () {
        var id = $(".panel-heading").text().split(': ')[0]
        RPC.call('docker.stop', id).then(
            function (message) {
                alert(message);
                get_containers();
            }, function (error) {
                alert(error);
                get_containers();
            });
    });


    $('#remove').on('click', function () {
        var id = $(".panel-heading").text().split(': ')[0]
        RPC.call('docker.remove', id).then(
            function (message) {
                alert("Ok!");
                get_containers();
            }, function (error) {
                alert(error);
                get_containers();
            });
    });

    $("#containers-pills a").on("click", function () {
        var $this = $(this);
        $("#containers-pills").find(".active").removeClass("active");
        $this.parent().addClass("active");

        var containers = $("#containers-list a");
        containers.each(function (idx, elem) {
            if ($this.text() == 'Started' && $(elem).text().includes('stopped')) {
                $(elem).hide();
            }
            else {
                $(elem).show();
            }
        });
    });

    var url = (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host + '/ws/';
    RPC = WSRPC(url, 5000);
    RPC.connect();
    get_images();
    get_containers();
});
