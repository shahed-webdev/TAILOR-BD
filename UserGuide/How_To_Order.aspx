<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="How_To_Order.aspx.cs" Inherits="TailorBD.UserGuide.How_To_Order" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">

    <style>
       td img {
            height: 100%;
            width: 100%;
        }
       td p
         {
            font-size:20px;
        }
        td a {
            font-size:25px;
        }
    </style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <!-- This is the recorded XML data that was used in generating this page. -->

    <table id="Steps">
        <tr>
            <td></td>
        </tr>
        <tr>
            <td>
                <h1>যে ভাবে অর্ডার দিবেন</h1>
            </td>
        </tr>
        <tr>
            <td></td>
        </tr>
    </table>


    <table id="Step1">
        <tr>
            <td>
                <b>
                    <a><< পুর্বের ধাপ
           
                    </a>
                    |
                <a title="পরবর্তি ধাপ" href="#Step2">পরবর্তি ধাপ >>
                </a>

                </b>
            </td>
        </tr>
        <tr>
            <td>
                <p>
                    <b>ধাপ 1: বাম পাশের লিংকের (অর্ডার) এ ক্লিক করুন</b>
                </p>
            </td>
        </tr>
        <tr>
            <td>

                <img src="Images/Order(1).png" />
            </td>
        </tr>
        <tr>
            <td>&nbsp;</td>
        </tr>
    </table>

    <table id="Step2">
        <tr>
            <td>

                <a title="পুর্বের ধাপ" href="#Step1"><< পুর্বের ধাপ
                </a>
                 |
                <a title="পরবর্তি ধাপ" href="#Step3">পরবর্তি ধাপ >>
                </a>
            </td>
        </tr>
        <tr>
            <td>
                <p>
                    <b>ধাপ 2: (অর্ডার দিন) এই লিংকে ক্লিক করুন</b>
                </p>
            </td>
        </tr>
        <tr>
            <td>

                <img src="Images/Order(2).png" />
            </td>
        </tr>
        <tr>
            <td>&nbsp;</td>
        </tr>
    </table>

    <table id="Step3">
        <tr>
            <td>
               
                <a title="পুর্বের ধাপ" href="#Step2"><< পুর্বের ধাপ
                </a>
                 |
                <a title="পরবর্তি ধাপ" href="#Step4">পরবর্তি ধাপ >>
                </a>
            </td>
        </tr>
        <tr>
            <td>
                <p>
                    <b>ধাপ 3: নতুন কাস্টমার এর অর্ডার নিতে লাল দাগ দেয়া টেক্সবক্সগুলি পুরণ করে (পরবর্তি ধাপ) এই বাটনে ক্লিক করুন</b>
                </p>
            </td>
        </tr>
        <tr>
            <td >
                <a>
                   <img src="Images/Order(3).png" />
            </td>
        </tr>
        <tr>
            <td></td>
        </tr>
    </table>

    <table id="Step4">
        <tr>
            <td>
               
                <a title="পুর্বের ধাপ" href="#Step3">
                   << পুর্বের ধাপ
                </a>
                 |
                <a title="পরবর্তি ধাপ" href="#Step5">
                    পরবর্তি ধাপ >>
                </a>
            </td>
        </tr>
        <tr>
            <td>
                <p>
                    <b>ধাপ 4: আর পুরাতন কাস্টমার হলে (পুরাতন কাস্টমার) এখানে ক্লিক করুন ও লাল দাগ দেয়া লিংক (অর্ডার দিন) এখানে ক্লিক করুন</b>
                </p>
            </td>
        </tr>
        <tr>
            <td>
                <a>
                  <img src="Images/Order(9).png" />
            </td>
        </tr>
    </table>

    <table id="Step5">
        <tr>
            <td>
               
                <a title="পুর্বের ধাপ" href="#Step4">
                   << পুর্বের ধাপ
                </a>
                 |
                <a title="পরবর্তি ধাপ" href="#Step6">
                    পরবর্তি ধাপ >>
                </a>
            </td>
        </tr>
        <tr>
            <td>
                <p>
                    <b>ধাপ 4: এবার কোন পোষাক বানাবেন তা সিলেক্ট করুন</b>
                </p>
            </td>
        </tr>
        <tr>
            <td>
                <a>
                  <img src="Images/Order(4).png" />
            </td>
        </tr>
    </table>

    <table id="Step6">
        <tr>
            <td>
               
                <a title="পুর্বের ধাপ" href="#Step5">
                   << পুর্বের ধাপ
                </a>
                 |
                <a title="পরবর্তি ধাপ" href="#Step7">
                   পরবর্তি ধাপ >>
                </a>
            </td>
        </tr>
        <tr>
            <td>
                <p>
                    <b>ধাপ 5:প্রথমে ১ নাম্বার ঘরে মাপগুলি দিন। তারপর ২ নাম্বার ঘরে (স্টাইল যুক্তরুন) এখানে টিক দিলেই দেখবেন আপনি এই পোষাকের জন্য যে স্টাইলগুলো দিয়েছিলেন তা আসছে, এখান থেকে কাস্টমারের পছন্দ অনুযায়ি স্টাইলগুলোদে টিক দিন । এবং ৩ নাম্বার ঘরে কয়টি পোষাক বানাবেন তা দিন ও  আরো বিস্তারিত লিখতে চাইলে লিখে কি বাবদ কত টাকা (চার্জ যুক্ত করুন) এই বাটনে ক্লিক করে করে খরচগুলি যুক্ত করুন। খরচ যুক্ত করা শেষ হলে (অর্ডার এড করুন) এই বাটনে ক্লিক করুন</b>
                </p>
            </td>
        </tr>
        <tr>
            <td>
                <a>
                   <img src="Images/Order(5).png" />
            </td>
        </tr>
    </table>

    <table id="Step7">
        <tr>
            <td>
               
                <a title="পুর্বের ধাপ" href="#Step6">
                   << পুর্বের ধাপ
                </a>
                 |
                <a title="পরবর্তি ধাপ" href="#Step8">
                   পরবর্তি ধাপ >>
                </a>
            </td>
        </tr>
        <tr>
            <td>
                <p>
                    <b>ধাপ 6:এই বার আপনি যদি আরো পোষাক বানাতে চান তা হলে পোষাক সিলেক্ট করে পূর্বের মতই অর্ডার এড করুন । আর যদি কোন পোষাক যুক্ত করতে না চান তাহলে (পরবর্তি ধাপে যান) এই বাটনে ক্লিক করুন </b>
                </p>
            </td>
        </tr>
        <tr>
            <td>
                <a>
                 <img src="Images/Order(6).png" />
            </td>
        </tr>
    </table>

    <table id="Step8">
        <tr>
            <td>
               
                <a title="পুর্বের ধাপ" href="#Step7">
                   << পুর্বের ধাপ
                </a>
                 |
                <a title="পরবর্তি ধাপ" href="#Step9">
                   পরবর্তি ধাপ >>
                </a>
            </td>
        </tr>
        <tr>
            <td>
                <p>
                    <b>ধাপ 7: এইবার নগত টাকা কত দিল তা দিন ও ডিস্কাউন দিলে তা দিন তারপর সাবমিট বাটন ক্লিক করুন</b>
                </p>
            </td>
        </tr>
        <tr>
            <td>
                <a>
                   <img src="Images/Order(7).png" />
            </td>
        </tr>
    </table>
    <table id="Step9">
        <tr>
            <td>
               
                <a title="পুর্বের ধাপ" href="#Step6">
                   << পুর্বের ধাপ
                </a>
                 |
                <a title="পরবর্তি ধাপ" href="#Step10">
                   পরবর্তি ধাপ >>
                </a>
            </td>
        </tr>
        <tr>
            <td>
                <p>
                    <b>ধাপ 7: এইবার কাস্টমারকে মানিরিসিট দিতে প্রিন্ট এর আইকনে ক্লিক করুন তারপর ফিনিশ বাটন ক্লিক করুন</b>
                </p>
            </td>
        </tr>
        <tr>
            <td>
                <a>
                   <img src="Images/Order(8).png" />
            </td>
        </tr>
    </table>
    <a href="#Steps">পেইজের উপরে যান</a>
</asp:Content>
