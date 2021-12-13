<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="TailorBD.Default" %>
<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title>Tailor BD - Online Tailor Shop Software</title>
    <!-- Font Awesome -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css" rel="stylesheet" />
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" rel="stylesheet" />
    <!-- MDB -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/3.10.1/mdb.min.css" rel="stylesheet" />
    <!-- custom -->
    <link href="CSS/home-page.css?v=1.0.0" rel="stylesheet" />
</head>
<body>
    <header id="home">
        <nav class="navbar navbar-expand-lg navbar-dark shadow-0">
            <div class="container">
                <h3 class="navbar-brand">Tailor BD.com</h3>

                <!-- Toggle button -->
                <button
                    class="navbar-toggler"
                    type="button"
                    data-mdb-toggle="collapse"
                    data-mdb-target="#navbarSupportedContent"
                    aria-controls="navbarSupportedContent"
                    aria-expanded="false"
                    aria-label="Toggle navigation">
                    <i class="fas fa-bars"></i>
                </button>

                <!-- Right elements -->
                <div class="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul class="navbar-nav align-items-center ms-auto mb-2 mb-lg-0">
                        <li class="nav-item">
                            <a class="nav-link" href="#home">Home</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link scrollTo" href="#about-us">About Us</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link scrollTo" href="#features">Features</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link scrollTo" href="#contact">Contact Us</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" target="_blank" href="https://www.facebook.com/Tailorbd">
                                <span class="facebook-button">
                                    <i class="fab fa-facebook-f"></i>
                                </span>
                            </a>
                        </li>
                        <form runat="server" style="display: inherit">
                            <asp:LoginView runat="server">
                                <AnonymousTemplate>
                                    <li class="nav-item">
                                        <a class="login-button" href="/Login.aspx">
                                            <i class="far fa-user"></i>
                                            Login
                                        </a>
                                    </li>
                                </AnonymousTemplate>
                                <LoggedInTemplate>
                                    <li class="nav-item mx-2">
                                        <a class="nav-link" href="/Profile_Redirect.aspx">
                                            <asp:LoginName runat="server" />
                                        </a>
                                    </li>
                                    <li class="nav-item d-flex align-items-center">
                                        <i class="far fa-user"></i>
                                        <asp:LoginStatus CssClass="nav-link" runat="server" LogoutPageUrl="~/Default.aspx" LogoutAction="Redirect" />
                                    </li>
                                </LoggedInTemplate>
                            </asp:LoginView>
                        </form>
                    </ul>
                </div>
            </div>
        </nav>

        <div class="container mt-5">
            <div class="row align-items-center">
                <div class="col-lg-7 col-md-6">
                    <div class="title-section mb-4 md-mb-0">
                        <h1>Tailors & Fabrics Shop</h1>
                        <h1 class="mb-4">Management Service</h1>
                        <p class="w-75">TailorBD.com is the ultimate software solution for all kinds of Tailoring shops & Fabric Retailers or wholesalers.</p>
                    </div>
                </div>

                <div class="col-lg-5 col-md-6">
                    <div class="hero-section">
                        <img src="/CSS/icon/home-hero-img.svg" alt="tailor bd" />
                    </div>
                </div>
            </div>
        </div>
    </header>

    <main>
        <section id="about-us" class="my-5">
            <div class="container">
                <div class="text-center mb-5">
                    <h2>Why Tailor BD ?</h2>
                    <p class="w-50 mx-auto">Our customers tell us on a day to day basis that our online software is the friendliest and easiest to use survey software that they have ever used.</p>
                </div>

                <div class="row g-4">
                    <div class="col-md-4">
                        <div class="card h-100 text-center">
                            <div class="card-body">
                                <i class="fas fa-mouse-pointer fa-4x"></i>
                                <h5 class="card-title my-4">Easy to Use</h5>
                                <p class="card-text">
                                    Our highly efficient software very easily adjustable with your existing management process and it has been designed to give you one-click access to the basic settings which you're most likely to change without digging through a confusing series of menus. 
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card h-100 text-center">
                            <div class="card-body">
                                <i class="fas fa-headset fa-4x"></i>
                                <h5 class="card-title my-4">Customer Support</h5>
                                <p class="card-text">You get 24-hour Customer Support, 6 days a week through phone, online chat, online meeting or email. Also, you can get assistance in 2 languages: English or Bengali. </p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card h-100 text-center">
                            <div class="card-body">
                                <i class="far fa-handshake fa-4x"></i>
                                <h5 class="card-title my-4">Flexible & Can Meet Your Requests</h5>
                                <p class="card-text">We continuously work on making the software better as time progresses so chances are that your requests will end up in our software. If you have a custom request that you think only you’d use, our custom solutions group can work with you closely to have your dream become a reality.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <%--<section id="user-counter">
            <div class="container">
                <div class="row">
                    <div class="col-md-4 text-center">
                        <i class="fas fa-store fa-2x"></i>
                        <h5 class="font-weight-bold mb-0 mt-3">20+</h5>
                        <p>Tailors</p>
                    </div>

                    <div class="col-md-4 text-center">
                        <i class="fas fa-users fa-2x"></i>
                        <h5 class="font-weight-bold mb-0 mt-3">20000+</h5>
                        <p>Happy Customers</p>
                    </div>

                    <div class="col-md-4 text-center">
                        <i class="fas fa-ruler fa-2x"></i>
                        <h5 class="font-weight-bold mb-0 mt-3">20000+</h5>
                        <p>Order Completed</p>
                    </div>
                </div>
            </div>
        </section>--%>

        <section id="features">
            <div class="container">
                <div class="text-center mb-5">
                    <h2>SOFTWARE FEATURES</h2>
                </div>

                <div class="row">
                    <div class="col-md-4">
                        <img src="AccessAdmin/CSS/Ico/cover.jpg" alt="" />
                    </div>
                    <div class="col-md-8">
                        <ul>
                            <li>It is very easy to use, and no installation is required. Zero data loss  secure.</li>
                            <li>Easy to excess, excess form anywhere (home, shop or office) and any device (PC, Laptop, Tab or Smartphone)</li>
                            <li>Customers can be searched by their Registration number or name or phone number.</li>
                            <li>Each customer’s measurement will be recorded automatically.</li>
                            <li>While ordering the system will show the measurement of the customers and if not recorded earlier, can be added with a few clicks.</li>
                            <li>Each ordered job will be available in a list to send cutter and tailor. Status of a tailoring job in hand will instantly be available.</li>
                            <li>System will maintain the customers and accounts and payment record.</li>
                            <li>System will maintain the customer’s account and will reflects previous outstanding, if any in new ordering receipt.</li>
                            <li>Showing various dresses and styles to the customers during taking order.</li>
                            <li>SMS Service with brand name (Completed work order, Delivery confirmation, Payment notification and providing any kind of Notice and greetings to Customers)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <section id="contact">
            <div class="container">
                <div class="text-center mb-5">
                    <h2>CONTACT US</h2>
                </div>

                <div class="row align-items-center">
                    <div class="col-md-7">
                        <div class="card card-body p-1">
                            <div class="map-container">
                                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.381111411498!2d90.39683401534037!3d23.769439393964767!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c7641aaaaaab%3A0x620f7558d4176ec7!2sLoops%20IT!5e0!3m2!1sen!2sbd!4v1639236855536!5m2!1sen!2sbd" frameborder="0" style="border: 0" allowfullscreen></iframe>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-5 contact-adddress p-5">
                        <div class="d-flex">
                            <i class="fas fa-map-pin fa-2x"></i>
                            <div class="ms-4">
                                <h5>Our Office Address</h5>
                                <p>328, East Nakhal Para,Tejgaon, Dhaka-1215</p>
                            </div>
                        </div>

                        <div class="d-flex my-4">
                            <i class="fas fa-envelope fa-2x"></i>
                            <div class="ms-4">
                                <h5>General Enquiries</h5>
                                <p>info@loopsit.com</p>
                            </div>
                        </div>

                        <div class="d-flex">
                            <i class="fas fa-phone fa-2x"></i>
                            <div class="ms-4">
                                <h5>Call Us</h5>
                                <p>+88 01739144141</p>
                            </div>
                        </div>

                        <div class="d-flex mt-4">
                            <i class="fas fa-clock fa-2x"></i>
                            <div class="ms-4">
                                <h5>Our Timing</h5>
                                <p>Sat - Thu : 09:00 AM - 07:00 PM</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer>
        <span>Copyright © 2015-<%: DateTime.Now.Year %> Tailorbd.com All rights reserved
        </span>
    </footer>

    <!-- MDB -->
    <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/3.10.1/mdb.min.js"></script>

    <script>
        $(".scrollTo").on('click', function (e) {
            e.preventDefault();
            const target = $(this).attr('href');
            $('html, body').animate({
                scrollTop: ($(target).offset().top)
            }, 2000);
        });
    </script>
</body>
</html>
