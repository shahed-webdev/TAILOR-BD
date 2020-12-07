<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Add_Style.aspx.cs" Inherits="TailorBD.UserGuide.Add_Style1" %>
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
                <h1>যে ভাবে পোষাকের স্টাইল যুক্ত করবেন</h1>
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
                    <b>ধাপ 1: বাম পাশের লিংকের বেসিক সেটিং এ ক্লিক করুন</b>
                </p>
            </td>
        </tr>
        <tr>
            <td>

                <img src="Images/d-1.PNG" />
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
                    <b>ধাপ 2: 	পোষাক ও মাপ যুক্ত করুন এই লিংকে ক্লিক করুন</b>
                </p>
            </td>
        </tr>
        <tr>
            <td>

                <img src="Images/d-2.PNG" />
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
                    <b>ধাপ 3: লাল দাগের ভিতরের আইকনে ক্লিক করুন</b>
                </p>
            </td>
        </tr>
        <tr>
            <td >
                <a>
                    <img src="Images/s-1.PNG"/></a>
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
                    <b>ধাপ 4: স্টাইল বা ডিজাইনের ক্যাটাগরির নাম দিয়ে (ক্যাটাগরির যুক্ত করুন) এই বাটনে ক্লিক করুন</b>
                </p>
            </td>
        </tr>
        <tr>
            <td>
                <a>
                    <img src="Images/s-2.PNG"/></a>
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
                    <b>ধাপ 5:ডিজাইনগুলি যুক্তকরার জন্য লাল দাগের ভিতরের আইকনে ক্লিক করুন</b>
                </p>
            </td>
        </tr>
        <tr>
            <td>
                <a>
                    <img  src="Images/s-3.PNG" /></a>
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
                    <b>ধাপ 5:স্টাইল বা ডিজাইনের নাম দিয়ে পারলে স্টাইল বা ডিজাইনের ছবি দিন ও (স্টাইল যুক্ত করুন) এই বাটনে ক্লিক করুন</b>
                </p>
            </td>
        </tr>
        <tr>
            <td>
                <a>
                    <img  src="Images/s-4.PNG" /></a>
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
                    <b>ধাপ 5:স্টাইল বা ডিজাইনের নাম যুক্ত করার পর চাইলে ইডিট ও ডিলিট করতে পারবেন। ইডিট করতে লাল গোল দাগের আইকনে ক্লিক করুন আর ডিলিট করতে চাইলে লাল স্টার এর ভিতরের আইকনে ক্লিক করুন</b>
                </p>
            </td>
        </tr>
        <tr>
            <td>
                <a>
                    <img  src="Images/s-5.PNG" /></a>
            </td>
        </tr>
    </table>
    <a href="#Steps">পেইজের উপরে যান</a>
</asp:Content>
