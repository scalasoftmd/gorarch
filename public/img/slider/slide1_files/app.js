$(document).ready(function () {
    let width = $(window).width();
    if (width < 1400) {
        $("#modalVideo").find(".modal-dialog").removeClass("modal-xl");
        $("#modalVideo").find(".modal-dialog").addClass("modal-lg");
    }
    scrollNavigation();
    setLanguage();
    new BeerSlider(document.getElementById("slider"));
});

$(".owl-carousel").owlCarousel({
    loop: true,
    margin: 10,
    nav: false,
    responsive: {
        0: {
            items: 2,
            dots: true,
        },
        600: {
            items: 3,
            dots: true,
        },
        1000: {
            items: 5,
        },
    },
});

$(document).scroll(function () {
    scrollNavigation();
});

$(".close-mnm-link").click(function () {
    $("#mobileNavigationModal").modal("hide");
});

function scrollNavigation() {
    if ($(window).scrollTop() >= 0) {
        $(".navigation").addClass("snavigation");
        $(".mobile-navigation").addClass("shadow-sm");
    }
    if ($(window).scrollTop() == 0) {
        $(".navigation").removeClass("snavigation");
        $(".mobile-navigation").removeClass("shadow-sm");
    }
}

$(".portfolio-item").hover(
    function () {
        $(this).find(".portfolio-item-title").css("display", "flex");
    },
    function () {
        $(this).find(".portfolio-item-title").css("display", "none");
    }
);

$(".portfolio-page-item").hover(
    function () {
        $(this).find(".portfolio-item-title").css("display", "flex");
    },
    function () {
        $(this).find(".portfolio-item-title").css("display", "none");
    }
);

/*
 ** Lang
 */
$(document).on("click", ".navigation-link-lang", function (event) {
    event.stopPropagation();

    let open = $(this).attr("data-open");
    if (open === "false") {
        $(".navigation-lang-dropdown").css("display", "flex");
        $(this).attr("data-open", "true");
    } else {
        $(".navigation-lang-dropdown").css("display", "none");
        $(this).attr("data-open", "false");
    }
});

$(document).on("click", function (event) {
    if (!$(event.target).closest(".navigation").length) {
        $(".navigation-lang-dropdown").css("display", "none");
        $(".navigation-link-lang").attr("data-open", "false");
    }
});

function setLanguage() {
    let browserLocale = navigator.language || navigator.userLanguage;
    let langCode = browserLocale.substring(0, 2);

    console.log(langCode);

    // switch (langCode) {
    //     case "ru":
    //         window.location.href = "/lang/set/russian";
    //         break;
    //     case "en":
    //         window.location.href = "/lang/set/english";
    //         break;
    //     case "de":
    //         window.location.href = "/lang/set/deutschland";
    //         break;
    //     default:
    //         window.location.href = "/lang/set/romanian";
    //         break;
    // }
}

/*
 ** Filter
 */
$(document).on("click", ".portfolio-filter-item", function () {
    let target = $(this).attr("data-target");
    if (target === "all") {
        $(".portfolio-blocks").find(".col-md-4").css("display", "block");
    } else {
        $(".portfolio-blocks").find(".col-md-4").css("display", "none");
        $(target).css("display", "block");
    }
    $(".portfolio-filter-item").removeClass("portfolio-filter-item-active");
    $(this).addClass("portfolio-filter-item-active");
});
