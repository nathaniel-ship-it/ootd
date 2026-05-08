const PRIVACY_POLICY_HTML = `
<style>
  [data-custom-class='body'], [data-custom-class='body'] * { background: transparent !important; }
  [data-custom-class='title'], [data-custom-class='title'] * { font-family: Arial !important; font-size: 26px !important; color: #000000 !important; }
  [data-custom-class='subtitle'], [data-custom-class='subtitle'] * { font-family: Arial !important; color: #595959 !important; font-size: 14px !important; }
  [data-custom-class='heading_1'], [data-custom-class='heading_1'] * { font-family: Arial !important; font-size: 19px !important; color: #000000 !important; }
  [data-custom-class='heading_2'], [data-custom-class='heading_2'] * { font-family: Arial !important; font-size: 17px !important; color: #000000 !important; }
  [data-custom-class='body_text'], [data-custom-class='body_text'] * { color: #595959 !important; font-size: 14px !important; font-family: Arial !important; }
  [data-custom-class='link'], [data-custom-class='link'] * { color: #3030F1 !important; font-size: 14px !important; font-family: Arial !important; word-break: break-word !important; }
  .pp-wrap ul { list-style-type: square; }
  .pp-wrap ul > li > ul { list-style-type: circle; }
  .pp-wrap ul > li > ul > li > ul { list-style-type: square; }
  .pp-wrap ol li { font-family: Arial; }
  .pp-wrap table { border-collapse: collapse; width: 100%; }
  .pp-wrap h1, .pp-wrap h2, .pp-wrap h3 { display: inline; }
</style>
<div class="pp-wrap" data-custom-class="body">
<div><strong><span style="font-size:26px"><span data-custom-class="title"><h1>PRIVACY POLICY</h1></span></span></strong></div>
<div><span style="color:rgb(127,127,127)"><strong><span style="font-size:15px"><span data-custom-class="subtitle">Last updated May 03, 2026</span></span></strong></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="color:rgb(89,89,89);font-size:15px"><span data-custom-class="body_text">This Privacy Notice for <strong>Nathaniel Joseph Zafran</strong> (doing business as <strong>OOTD</strong>) ("<strong>we</strong>," "<strong>us</strong>," or "<strong>our</strong>"), describes how and why we might access, collect, store, use, and/or share ("<strong>process</strong>") your personal information when you use our services ("<strong>Services</strong>"), including when you:</span></span></div>
<ul>
<li data-custom-class="body_text" style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)">Download and use our mobile application (<strong>OOTD</strong>), or any other application of ours that links to this Privacy Notice</span></li>
<li data-custom-class="body_text" style="line-height:1.5"><span style="font-size:15px">Use OOTD. OOTD is an AI-powered outfit rating app that allows users to upload photos of their outfits and receive a score out of 100, along with a detailed style breakdown, feedback, and upgrade tips. The app tracks rating history, streaks, and builds a personalized style profile over time. A Pro subscription unlocks unlimited ratings, full history, and style analytics.</span></li>
<li data-custom-class="body_text" style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)">Engage with us in other related ways, including any marketing or events</span></li>
</ul>
<div style="line-height:1.5"><span style="font-size:15px;color:rgb(127,127,127)"><span data-custom-class="body_text"><strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <a href="mailto:ootdsupport@gmail.com" data-custom-class="link" target="_blank">ootdsupport@gmail.com</a>.</span></span></div>
<div><br></div>
<div style="line-height:1.5"><strong><span style="font-size:15px"><span data-custom-class="heading_1"><h2>SUMMARY OF KEY POINTS</h2></span></span></strong></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text"><strong><em>This summary provides key points from our Privacy Notice.</em></strong></span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text"><strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the choices you make.</span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text"><strong>Do we process any sensitive personal information?</strong> We do not process sensitive personal information.</span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text"><strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.</span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text"><strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text"><strong>How do we keep your information safe?</strong> We have organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet can be guaranteed to be 100% secure.</span></span></div>
<div><br></div>
<div id="toc" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>TABLE OF CONTENTS</h2></span></strong></div>
<div style="line-height:1.5"><a data-custom-class="link" href="#infocollect" style="color:rgb(0,58,250)">1. WHAT INFORMATION DO WE COLLECT?</a></div>
<div style="line-height:1.5"><a data-custom-class="link" href="#infouse" style="color:rgb(0,58,250)">2. HOW DO WE PROCESS YOUR INFORMATION?</a></div>
<div style="line-height:1.5"><a data-custom-class="link" href="#legalbases" style="color:rgb(0,58,250)">3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?</a></div>
<div style="line-height:1.5"><a data-custom-class="link" href="#whoshare" style="color:rgb(0,58,250)">4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</a></div>
<div style="line-height:1.5"><a data-custom-class="link" href="#ai" style="color:rgb(0,58,250)">5. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</a></div>
<div style="line-height:1.5"><a data-custom-class="link" href="#sociallogins" style="color:rgb(0,58,250)">6. HOW DO WE HANDLE YOUR SOCIAL LOGINS?</a></div>
<div style="line-height:1.5"><a data-custom-class="link" href="#intltransfers" style="color:rgb(0,58,250)">7. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?</a></div>
<div style="line-height:1.5"><a data-custom-class="link" href="#inforetain" style="color:rgb(0,58,250)">8. HOW LONG DO WE KEEP YOUR INFORMATION?</a></div>
<div style="line-height:1.5"><a data-custom-class="link" href="#infosafe" style="color:rgb(0,58,250)">9. HOW DO WE KEEP YOUR INFORMATION SAFE?</a></div>
<div style="line-height:1.5"><a data-custom-class="link" href="#infominors" style="color:rgb(0,58,250)">10. DO WE COLLECT INFORMATION FROM MINORS?</a></div>
<div style="line-height:1.5"><a data-custom-class="link" href="#privacyrights" style="color:rgb(0,58,250)">11. WHAT ARE YOUR PRIVACY RIGHTS?</a></div>
<div style="line-height:1.5"><a data-custom-class="link" href="#DNT" style="color:rgb(0,58,250)">12. CONTROLS FOR DO-NOT-TRACK FEATURES</a></div>
<div style="line-height:1.5"><a data-custom-class="link" href="#uslaws" style="color:rgb(0,58,250)">13. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</a></div>
<div style="line-height:1.5"><a data-custom-class="link" href="#policyupdates" style="color:rgb(0,58,250)">14. DO WE MAKE UPDATES TO THIS NOTICE?</a></div>
<div style="line-height:1.5"><a data-custom-class="link" href="#contact" style="color:rgb(0,58,250)">15. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a></div>
<div style="line-height:1.5"><a data-custom-class="link" href="#request" style="color:rgb(0,58,250)">16. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</a></div>
<div><br></div>

<div id="infocollect" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>1. WHAT INFORMATION DO WE COLLECT?</h2></span></strong>
<span data-custom-class="heading_2"><strong><h3>Personal information you disclose to us</h3></strong></span>
<span style="color:rgb(89,89,89);font-size:15px"><span data-custom-class="body_text"><strong><em>In Short: </em></strong><em>We collect personal information that you provide to us.</em></span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text">We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text"><strong>Personal Information Provided by You.</strong> The personal information we collect may include the following:</span></span></div>
<ul>
<li data-custom-class="body_text" style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)">names</span></li>
<li data-custom-class="body_text" style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)">email addresses</span></li>
<li data-custom-class="body_text" style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)">usernames</span></li>
<li data-custom-class="body_text" style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)">passwords</span></li>
<li data-custom-class="body_text" style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)">contact or authentication data</span></li>
<li data-custom-class="body_text" style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)">phone numbers</span></li>
</ul>
<div id="sensitiveinfo" style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text"><strong>Sensitive Information.</strong> We do not process sensitive information.</span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text"><strong>Payment Data.</strong> We may collect data necessary to process your payment if you choose to make purchases. All payment data is handled and stored by <strong>Apple App Store</strong>. You may find their privacy notice here: <a href="https://www.apple.com/legal/privacy/en-ww/" data-custom-class="link" target="_blank" style="color:rgb(0,58,250)">https://www.apple.com/legal/privacy/en-ww/</a>.</span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text"><strong>Social Media Login Data.</strong> We may provide you with the option to register with us using your existing social media account details. If you choose to register in this way, we will collect certain profile information about you from the social media provider, as described in the section <a data-custom-class="link" href="#sociallogins" style="color:rgb(0,58,250)">HOW DO WE HANDLE YOUR SOCIAL LOGINS?</a> below.</span></span></div>
<div><br></div>
<div style="line-height:1.5"><span data-custom-class="body_text"><span style="font-size:15px"><strong>Application Data.</strong> If you use our application(s), we also may collect the following information if you choose to provide us with access or permission:</span></span></div>
<ul>
<li data-custom-class="body_text" style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text"><em>Push Notifications.</em> We may request to send you push notifications regarding your account or certain features of the application(s). If you wish to opt out from receiving these types of communications, you may turn them off in your device's settings.</span></span></li>
</ul>
<div style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text">All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.</span></span></div>
<div><br></div>

<div id="infouse" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>2. HOW DO WE PROCESS YOUR INFORMATION?</h2></span></strong>
<span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text"><strong><em>In Short: </em></strong><em>We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</em></span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text"><strong>We process your personal information for a variety of reasons, depending on how you interact with our Services, including:</strong></span></span></div>
<ul>
<li data-custom-class="body_text" style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><strong>To facilitate account creation and authentication and otherwise manage user accounts.</strong> We may process your information so you can create and log in to your account, as well as keep your account in working order.</span></li>
<li data-custom-class="body_text" style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><strong>To deliver and facilitate delivery of services to the user.</strong> We may process your information to provide you with the requested service.</span></li>
<li data-custom-class="body_text" style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><strong>To respond to user inquiries/offer support to users.</strong> We may process your information to respond to your inquiries and solve any potential issues you might have with the requested service.</span></li>
<li data-custom-class="body_text" style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><strong>To send administrative information to you.</strong> We may process your information to send you details about our products and services, changes to our terms and policies, and other similar information.</span></li>
<li data-custom-class="body_text" style="line-height:1.5"><span data-custom-class="body_text"><span style="font-size:15px"><strong>To fulfill and manage your orders.</strong> We may process your information to fulfill and manage your orders, payments, returns, and exchanges made through the Services.</span></span></li>
<li data-custom-class="body_text" style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><strong>To request feedback.</strong> We may process your information when necessary to request feedback and to contact you about your use of our Services.</span></li>
<li data-custom-class="body_text" style="line-height:1.5"><span data-custom-class="body_text"><span style="font-size:15px"><strong>To protect our Services.</strong> We may process your information as part of our efforts to keep our Services safe and secure, including fraud monitoring and prevention.</span></span></li>
<li data-custom-class="body_text" style="line-height:1.5"><span data-custom-class="body_text"><span style="font-size:15px"><strong>To identify usage trends.</strong> We may process information about how you use our Services to better understand how they are being used so we can improve them.</span></span></li>
<li data-custom-class="body_text" style="line-height:1.5"><span data-custom-class="body_text"><span style="font-size:15px"><strong>To save or protect an individual's vital interest.</strong> We may process your information when necessary to save or protect an individual's vital interest, such as to prevent harm.</span></span></li>
</ul>
<div><br></div>

<div id="legalbases" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR INFORMATION?</h2></span></strong>
<em><span style="font-size:15px"><span data-custom-class="body_text"><strong>In Short: </strong>We only process your personal information when we believe it is necessary and we have a valid legal reason to do so under applicable law, like with your consent, to comply with laws, to provide you with services to enter into or fulfill our contractual obligations, to protect your rights, or to fulfill our legitimate business interests.</span></span></em></div>
<div><br></div>
<div style="line-height:1.5"><em><span style="font-size:15px"><span data-custom-class="body_text"><strong><u>If you are located in the EU or UK, this section applies to you.</u></strong></span></span></em></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text">The General Data Protection Regulation (GDPR) and UK GDPR require us to explain the valid legal bases we rely on in order to process your personal information. As such, we may rely on the following legal bases to process your personal information:</span></span></div>
<ul>
<li data-custom-class="body_text" style="line-height:1.5"><span style="font-size:15px"><strong>Consent.</strong> We may process your information if you have given us permission to use your personal information for a specific purpose. You can withdraw your consent at any time.</span></li>
<li data-custom-class="body_text" style="line-height:1.5"><span data-custom-class="body_text"><span style="font-size:15px"><strong>Performance of a Contract.</strong> We may process your personal information when we believe it is necessary to fulfill our contractual obligations to you, including providing our Services or at your request prior to entering into a contract with you.</span></span></li>
<li data-custom-class="body_text" style="line-height:1.5"><span data-custom-class="body_text"><span style="font-size:15px"><strong>Legitimate Interests.</strong> We may process your information when we believe it is reasonably necessary to achieve our legitimate business interests and those interests do not outweigh your interests and fundamental rights and freedoms.</span></span></li>
<li data-custom-class="body_text" style="line-height:1.5"><span data-custom-class="body_text"><span style="font-size:15px"><strong>Legal Obligations.</strong> We may process your information where we believe it is necessary for compliance with our legal obligations, such as to cooperate with a law enforcement body or regulatory agency, exercise or defend our legal rights, or disclose your information as evidence in litigation in which we are involved.</span></span></li>
<li data-custom-class="body_text" style="line-height:1.5"><span data-custom-class="body_text"><span style="font-size:15px"><strong>Vital Interests.</strong> We may process your information where we believe it is necessary to protect your vital interests or the vital interests of a third party, such as situations involving potential threats to the safety of any person.</span></span></li>
</ul>
<div><br></div>
<div style="line-height:1.5"><span data-custom-class="body_text"><span style="font-size:15px"><strong><u><em>If you are located in Canada, this section applies to you.</em></u></strong></span></span></div>
<div><br></div>
<div style="line-height:1.5"><span data-custom-class="body_text"><span style="font-size:15px">We may process your information if you have given us specific permission (i.e., express consent) to use your personal information for a specific purpose, or in situations where your permission can be inferred (i.e., implied consent). You can withdraw your consent at any time.</span></span></div>
<div><br></div>

<div id="whoshare" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2></span></strong>
<span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> We may share information in specific situations described in this section and/or with the following third parties.</em></span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text">We may need to share your personal information in the following situations:</span></span></div>
<ul>
<li data-custom-class="body_text" style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text"><strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</span></span></li>
</ul>
<div><br></div>

<div id="ai" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>5. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</h2></span></strong>
<strong><em><span data-custom-class="body_text">In Short:</span></em></strong><em><span data-custom-class="body_text"> We offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies.</span></em></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text">As part of our Services, we offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies (collectively, "AI Products"). These tools are designed to enhance your experience and provide you with innovative solutions. The terms in this Privacy Notice govern your use of the AI Products within our Services.</span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><strong><span data-custom-class="body_text">Use of AI Technologies</span></strong></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text">We provide the AI Products through third-party service providers ("AI Service Providers"), including <strong>OpenAI</strong>. As outlined in this Privacy Notice, your input, output, and personal information will be shared with and processed by these AI Service Providers to enable your use of our AI Products. You must not use the AI Products in any way that violates the terms or policies of any AI Service Provider.</span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><strong><span data-custom-class="body_text">Our AI Products</span></strong></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text">Our AI Products are designed for the following functions:</span></span></div>
<ul>
<li data-custom-class="body_text" style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text">Image analysis</span></span></li>
</ul>
<div style="line-height:1.5"><span style="font-size:15px"><strong><span data-custom-class="body_text">How We Process Your Data Using AI</span></strong></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text">All personal information processed using our AI Products is handled in line with our Privacy Notice and our agreement with third parties. This ensures high security and safeguards your personal information throughout the process.</span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><strong><span data-custom-class="body_text">How to Opt Out</span></strong></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text">To opt out, you can: Log in to your account settings and update your user account.</span></span></div>
<div><br></div>

<div id="sociallogins" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>6. HOW DO WE HANDLE YOUR SOCIAL LOGINS?</h2></span></strong>
<span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text"><strong><em>In Short: </em></strong><em>If you choose to register or log in to our Services using a social media account, we may have access to certain information about you.</em></span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text">Our Services offer you the ability to register and log in using your third-party social media account details (like your Facebook or X logins). Where you choose to do this, we will receive certain profile information about you from your social media provider. The profile information we receive may vary depending on the social media provider concerned, but will often include your name, email address, friends list, and profile picture, as well as other information you choose to make public on such a social media platform.</span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text">We will use the information we receive only for the purposes that are described in this Privacy Notice or that are otherwise made clear to you on the relevant Services. Please note that we do not control, and are not responsible for, other uses of your personal information by your third-party social media provider. We recommend that you review their privacy notice to understand how they collect, use, and share your personal information, and how you can set your privacy preferences on their sites and apps.</span></span></div>
<div><br></div>

<div id="intltransfers" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>7. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?</h2></span></strong>
<span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text"><strong><em>In Short: </em></strong><em>We may transfer, store, and process your information in countries other than your own.</em></span></span></div>
<div><br></div>
<div data-custom-class="body_text" style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)">Our servers are located in the <strong>United States</strong>. Regardless of your location, please be aware that your information may be transferred to, stored by, and processed by us in our facilities and in the facilities of the third parties with whom we may share your personal information, including facilities in the United States and other countries.</span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text">If you are a resident in the European Economic Area (EEA), United Kingdom (UK), or Switzerland, then these countries may not necessarily have data protection laws or other similar laws as comprehensive as those in your country. However, we will take all necessary measures to protect your personal information in accordance with this Privacy Notice and applicable law.</span></span></div>
<div><br></div>

<div id="inforetain" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>8. HOW LONG DO WE KEEP YOUR INFORMATION?</h2></span></strong>
<span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text"><strong><em>In Short: </em></strong><em>We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.</em></span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text">We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law. No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.</span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text">When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible, then we will securely store your personal information and isolate it from any further processing until deletion is possible.</span></span></div>
<div><br></div>

<div id="infosafe" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>9. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2></span></strong>
<span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text"><strong><em>In Short: </em></strong><em>We aim to protect your personal information through a system of organizational and technical security measures.</em></span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text">We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.</span></span></div>
<div><br></div>

<div id="infominors" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>10. DO WE COLLECT INFORMATION FROM MINORS?</h2></span></strong>
<span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> We do not knowingly collect data from or market to children under 18 years of age or the equivalent age as specified by law in your jurisdiction.</em></span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text">We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent's use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18, please contact us at <a href="mailto:ootdsupport@gmail.com" data-custom-class="link" target="_blank" style="color:rgb(0,58,250)">ootdsupport@gmail.com</a>.</span></span></div>
<div><br></div>

<div id="privacyrights" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>11. WHAT ARE YOUR PRIVACY RIGHTS?</h2></span></strong>
<span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> Depending on your state of residence in the US or in some regions, such as the European Economic Area (EEA), United Kingdom (UK), Switzerland, and Canada, you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time, depending on your country, province, or state of residence.</em></span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text">In some regions (like the EEA, UK, Switzerland, and Canada), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; (iv) if applicable, to data portability; and (v) not to be subject to automated decision-making. In certain circumstances, you may also have the right to object to the processing of your personal information. You can make such a request by contacting us by using the contact details provided in the section <a data-custom-class="link" href="#contact" style="color:rgb(0,58,250)">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a> below.</span></span></div>
<div><br></div>
<div id="withdrawconsent" style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text"><strong><u>Withdrawing your consent:</u></strong> If we are relying on your consent to process your personal information, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us by using the contact details provided in the section <a data-custom-class="link" href="#contact" style="color:rgb(0,58,250)">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a> below.</span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="heading_2"><strong><h3>Account Information</h3></strong></span></span>
<span data-custom-class="body_text"><span style="font-size:15px">If you would at any time like to review or change the information in your account or terminate your account, you can log in to your account settings and update your user account.</span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text">Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.</span></span></div>
<div><br></div>
<div style="line-height:1.5"><span data-custom-class="body_text"><span style="font-size:15px">If you have questions or comments about your privacy rights, you may email us at <a href="mailto:ootdsupport@gmail.com" data-custom-class="link" target="_blank" style="color:rgb(0,58,250)">ootdsupport@gmail.com</a>.</span></span></div>
<div><br></div>

<div id="DNT" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>12. CONTROLS FOR DO-NOT-TRACK FEATURES</h2></span></strong>
<span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text">Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.</span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text">California law requires us to let you know how we respond to web browser DNT signals. Because there currently is not an industry or legal standard for recognizing or honoring DNT signals, we do not respond to them at this time.</span></span></div>
<div><br></div>

<div id="uslaws" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>13. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</h2></span></strong>
<span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text"><strong><em>In Short: </em></strong><em>If you are a resident of California, Colorado, Connecticut, Delaware, Florida, Indiana, Iowa, Kentucky, Maryland, Minnesota, Montana, Nebraska, New Hampshire, New Jersey, Oregon, Rhode Island, Tennessee, Texas, Utah, or Virginia, you may have the right to request access to and receive details about the personal information we maintain about you and how we have processed it, correct inaccuracies, get a copy of, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. More information is provided below.</em></span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="heading_2"><strong><h3>Categories of Personal Information We Collect</h3></span></span></strong></div>
<table style="width:100%">
  <thead><tr>
    <th style="width:34%;border:1px solid black;text-align:left;padding:6px"><span data-custom-class="body_text"><strong>Category</strong></span></th>
    <th style="width:51%;border:1px solid black;text-align:left;padding:6px"><span data-custom-class="body_text"><strong>Examples</strong></span></th>
    <th style="width:15%;border:1px solid black;text-align:left;padding:6px"><span data-custom-class="body_text"><strong>Collected</strong></span></th>
  </tr></thead>
  <tbody>
    <tr><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">A. Identifiers</span></td><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">Contact details, such as real name, alias, postal address, telephone or mobile contact number, unique personal identifier, online identifier, Internet Protocol address, email address, and account name</span></td><td style="border:1px solid black;padding:6px;text-align:center"><span data-custom-class="body_text">YES</span></td></tr>
    <tr><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">B. Personal information as defined in the California Customer Records statute</span></td><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">Name, contact information, education, employment, employment history, and financial information</span></td><td style="border:1px solid black;padding:6px;text-align:center"><span data-custom-class="body_text">YES</span></td></tr>
    <tr><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">C. Protected classification characteristics under state or federal law</span></td><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">Gender, age, date of birth, race and ethnicity, national origin, marital status, and other demographic data</span></td><td style="border:1px solid black;padding:6px;text-align:center"><span data-custom-class="body_text">NO</span></td></tr>
    <tr><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">D. Commercial information</span></td><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">Transaction information, purchase history, financial details, and payment information</span></td><td style="border:1px solid black;padding:6px;text-align:center"><span data-custom-class="body_text">YES</span></td></tr>
    <tr><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">E. Biometric information</span></td><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">Fingerprints and voiceprints</span></td><td style="border:1px solid black;padding:6px;text-align:center"><span data-custom-class="body_text">NO</span></td></tr>
    <tr><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">F. Internet or other similar network activity</span></td><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">Browsing history, search history, online behavior, interest data, and interactions with our and other websites, applications, systems, and advertisements</span></td><td style="border:1px solid black;padding:6px;text-align:center"><span data-custom-class="body_text">NO</span></td></tr>
    <tr><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">G. Geolocation data</span></td><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">Device location</span></td><td style="border:1px solid black;padding:6px;text-align:center"><span data-custom-class="body_text">NO</span></td></tr>
    <tr><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">H. Audio, electronic, sensory, or similar information</span></td><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">Images and audio, video or call recordings created in connection with our business activities</span></td><td style="border:1px solid black;padding:6px;text-align:center"><span data-custom-class="body_text">YES</span></td></tr>
    <tr><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">I. Professional or employment-related information</span></td><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">Business contact details in order to provide you our Services at a business level or job title, work history, and professional qualifications if you apply for a job with us</span></td><td style="border:1px solid black;padding:6px;text-align:center"><span data-custom-class="body_text">NO</span></td></tr>
    <tr><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">J. Education Information</span></td><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">Student records and directory information</span></td><td style="border:1px solid black;padding:6px;text-align:center"><span data-custom-class="body_text">NO</span></td></tr>
    <tr><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">K. Inferences drawn from collected personal information</span></td><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">Inferences drawn from any of the collected personal information listed above to create a profile or summary about, for example, an individual's preferences and characteristics</span></td><td style="border:1px solid black;padding:6px;text-align:center"><span data-custom-class="body_text">NO</span></td></tr>
    <tr><td style="border:1px solid black;padding:6px"><span data-custom-class="body_text">L. Sensitive personal Information</span></td><td style="border:1px solid black;padding:6px"></td><td style="border:1px solid black;padding:6px;text-align:center"><span data-custom-class="body_text">NO</span></td></tr>
  </tbody>
</table>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text">We will use and retain the collected personal information as needed to provide the Services or for: Category A, B, D, H — As long as the user has an account with us.</span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="heading_2"><strong><h3>How to Exercise Your Rights</h3></strong></span></span>
<span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text">To exercise these rights, you can contact us by submitting a <a data-custom-class="link" href="https://app.termly.io/dsar/7404da9e-0b8e-4245-b628-0823b346417d" rel="noopener noreferrer" target="_blank" style="color:rgb(0,58,250)">data subject access request</a>, by emailing us at <a href="mailto:ootdsupport@gmail.com" data-custom-class="link" target="_blank" style="color:rgb(0,58,250)">ootdsupport@gmail.com</a>, by visiting <a data-custom-class="link" href="https://coruscating-cocada-4a5635.netlify.app" target="_blank" style="color:rgb(0,58,250)">https://coruscating-cocada-4a5635.netlify.app</a>, or by referring to the contact details at the bottom of this document.</span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="heading_2"><strong><h3>Appeals</h3></strong></span></span>
<span style="font-size:15px"><span data-custom-class="body_text">Under certain US state data protection laws, if we decline to take action regarding your request, you may appeal our decision by emailing us at <a href="mailto:ootdsupport@gmail.com" data-custom-class="link" target="_blank" style="color:rgb(0,58,250)">ootdsupport@gmail.com</a>. We will inform you in writing of any action taken or not taken in response to the appeal, including a written explanation of the reasons for the decisions. If your appeal is denied, you may submit a complaint to your state attorney general.</span></span></div>
<div><br></div>

<div id="policyupdates" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>14. DO WE MAKE UPDATES TO THIS NOTICE?</h2></span></strong>
<span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text"><em><strong>In Short: </strong>Yes, we will update this notice as necessary to stay compliant with relevant laws.</em></span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text">We may update this Privacy Notice from time to time. The updated version will be indicated by an updated "Revised" date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.</span></span></div>
<div><br></div>

<div id="contact" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>15. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2></span></strong>
<span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text">If you have questions or comments about this notice, you may email us at <a href="mailto:ootdsupport@gmail.com" data-custom-class="link" target="_blank" style="color:rgb(0,58,250)">ootdsupport@gmail.com</a> or contact us by post at:</span></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text">Nathaniel Joseph Zafran<br>1506 Oriole Ave<br>Sunnyvale, CA 94087<br>United States</span></span></div>
<div><br></div>

<div id="request" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>16. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2></span></strong>
<span style="font-size:15px;color:rgb(89,89,89)"><span data-custom-class="body_text">Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please fill out and submit a <a data-custom-class="link" href="https://app.termly.io/dsar/7404da9e-0b8e-4245-b628-0823b346417d" rel="noopener noreferrer" target="_blank" style="color:rgb(0,58,250)">data subject access request</a>.</span></span></div>
<div><br></div>
<div><span data-custom-class="body_text">This Privacy Policy was created using Termly's <a href="https://termly.io/products/privacy-policy-generator/" target="_blank" rel="noopener external" data-custom-class="link" style="color:rgb(0,58,250)">Privacy Policy Generator</a>.</span></div>
</div>
`;

export default PRIVACY_POLICY_HTML;
