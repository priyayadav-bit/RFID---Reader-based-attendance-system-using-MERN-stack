# RFID - Reader Based Attendance System Using MERN Stack

**Project Report**

An IoT-based attendance system using NodeMCU ESP8266, RFID reader RC522 and a MERN stack web application.

Internet of Things (IoT) | 2026

---

## Chapter 1: Introduction

Attendance is taken in every school and college to keep a record of the students who are present in class. In most places this is still done on paper, where the teacher calls out the names one by one and marks them in a register. This method takes a lot of class time, and mistakes can happen easily, like marking a wrong name or losing the register. Sometimes students also mark attendance for their absent friends, which makes the record wrong.

To solve these problems, an IoT based Smart Attendance System is designed in this project. In this system every student has an RFID card, and the attendance is marked automatically when the card is scanned. The system is built using the NodeMCU ESP8266, which acts as the main controller and also has built-in Wi-Fi. An RFID reader (RC522) is connected to it to read the unique ID of each card. After reading the card, the NodeMCU sends the data through Wi-Fi to a web application made with the MERN stack.

The web application stores the attendance data in a database and shows it on a web page. Teachers can open this page on a computer or a phone and see which students are present, along with the date and time of their attendance. This helps teachers to check the attendance easily without any paper work, and the records stay safe for later use.

The main objective of this project is to develop a simple, low-cost and fast attendance system that reduces manual work and avoids mistakes. The system gives quick response, works smoothly and is easy to use for both teachers and students. As the demand for automation in institutes is growing, this system has many uses and can be improved further in the future.

## Chapter 2: Literature Review

In past years, many methods have been used for taking attendance in classrooms. The oldest method is the paper register, which is simple but slow and can have many mistakes. Later, some systems used barcode cards, fingerprint scanners and face recognition cameras. Fingerprint systems are accurate, but all the students have to touch the same device one by one, which takes time. Face recognition systems need costly cameras and good light, so they are not suitable for every institute. RFID technology became popular because the cards are cheap and can be read quickly from a short distance without any touch. With the growth of IoT, microcontrollers like the NodeMCU ESP8266, which has built-in Wi-Fi, are used to send the card data directly to a server through the internet. Many earlier systems saved the data only in the device memory or in a simple sheet, so it was difficult to see the records from anywhere. To overcome this, recent designs use a web application with a database so that the attendance can be stored safely and checked online at any time. Based on these developments, this project is designed to provide a simple, low-cost and reliable smart attendance system using RFID, NodeMCU and the MERN stack.

## Chapter 3: Components and Tools Used

### Hardware Components

- **NodeMCU ESP8266:** Used as the main controller to read data from the RFID reader and connect to Wi-Fi.
- **RFID Reader (RC522):** Used to read the unique ID of the RFID card.
- **RFID Cards / Tags:** Used as the identity of students, one card for each student.
- **Jumper Wires:** Used to connect all components together.
- **Breadboard:** Used for easy circuit setup without soldering.
- **Onboard LED:** Blue LED already present on the NodeMCU board, used to show the result of a card scan.
- **Power Supply:** Provides power to the system through a USB cable.

### Software Components

- **Arduino IDE:** Used to write and upload the program to the NodeMCU.
- **Visual Studio Code:** Used to write the code of the web application.
- **MERN Stack:** Used to build the web application. MongoDB stores the data, Express.js and Node.js work as the server, and React.js is used for the web pages.

## Chapter 4: System Design and Architecture

In this project, a system is designed to record the attendance of students automatically using RFID cards. The main controller used is the NodeMCU ESP8266, which controls the whole operation of the system. The RFID reader RC522 is connected to the NodeMCU, and it reads the card whenever a student places it near the reader. The onboard LED of the NodeMCU blinks to show that the card has been read. The NodeMCU connects to a Wi-Fi network and sends the card ID to the server of the MERN stack web application. The server checks the card ID, finds the student in the MongoDB database and saves the attendance with date and time. The React web page then shows these records to the teacher. The system works in real time, which makes it fast, reliable and suitable for use in classrooms.

- NodeMCU is used as the main controller of the system.
- RFID reader reads the unique ID of the student card.
- Onboard LED of the NodeMCU blinks after every scan.
- Wi-Fi connection is used to send data to the server.
- Node.js and Express.js server receives and processes the card data.
- MongoDB database stores the student details and attendance records.
- React web page shows the attendance records to the teacher.

## Chapter 5: Methodology and Working Principle

In this project, the methodology involves a step-by-step process of designing, connecting and testing the system by combining both hardware and software parts. First, all the required components such as the NodeMCU ESP8266, RFID reader RC522, RFID cards, jumper wires and breadboard were collected. The RFID reader was connected to the NodeMCU using jumper wires on the breadboard. The NodeMCU was then programmed using Arduino IDE, where the code for reading the card and connecting to Wi-Fi was written. After that, the web application was made using the MERN stack. The backend server was created with Node.js and Express.js, the student and attendance data was kept in MongoDB, and the web pages were made with React.js. Finally, the NodeMCU was connected to the server and the whole system was tested with different cards.

The working principle of the system is based on the communication between the RFID card, the NodeMCU and the web application. When a student places the RFID card near the RC522 reader, the reader reads the unique ID of the card and gives it to the NodeMCU. The NodeMCU blinks its onboard LED to show that the card is read, and then sends this ID to the server through Wi-Fi. The server matches the ID with the student records in the database. If the card is found, the attendance of that student is saved with the current date and time. The teacher can then open the web page and see the updated attendance. This low-cost and user-friendly system gives quick response and reduces the manual work of the teacher.

## Chapter 6: Implementation and Experimental Setup

In this project, the implementation was carried out by connecting all the required hardware components properly with jumper wires and then linking them with the software part. The NodeMCU ESP8266 was used as the main controller and was programmed through Arduino IDE. The RFID reader RC522 was connected to the NodeMCU, and the onboard LED of the NodeMCU was used to give a signal after every scan. All components were connected on a breadboard and power was given through a USB cable. The NodeMCU was connected to a Wi-Fi network and set to send the card ID to the server. The MERN stack web application was run on a computer in the same network. For the experiment, different RFID cards were scanned one by one and the records shown on the web page were checked. It was found that the attendance was saved correctly with quick response and stable performance.

## Chapter 7: Results and Observations

In this project, the Smart Attendance System was successfully implemented and tested under different conditions. The NodeMCU ESP8266 was able to connect properly to the Wi-Fi network and send data to the server. During testing, every registered RFID card was read by the RC522 reader and the onboard LED of the NodeMCU blinked each time. The server received the card ID and the attendance was saved in the MongoDB database without any problem. The web page showed the name of the student, date and time of the attendance correctly. Cards which were not registered were also checked, and the system did not mark attendance for them. The overall performance of the system was stable and no major errors were found during testing. The system showed good response time and reliable operation, making it suitable for use in classrooms.

- NodeMCU ESP8266 connected successfully to the Wi-Fi network.
- RFID reader read the card ID correctly every time.
- Onboard LED of the NodeMCU blinked properly after each scan.
- Data was sent to the server without any delay.
- Attendance was saved correctly in the MongoDB database.
- Web page showed the attendance records properly.
- Unregistered cards were not accepted by the system.
- System showed fast response time.
- No major errors or failures were observed during testing.

## Chapter 8: Applications and Future Scope

The Smart Attendance System is very useful in daily life and helps in reducing the manual work of teachers. It allows attendance to be marked just by scanning a card and lets teachers see the records easily on a web page. This system saves time and gives more correct records.

- The system can be used in schools and colleges to take daily class attendance.
- It can be used in offices to record the entry time of employees.
- Useful in libraries and laboratories to keep a record of who is using them.
- Can be used in hostels and coaching centres to track students.
- Can be used in events and seminars to record the people who attended.

The system can be further improved by adding more features. It has a wide scope for development and can be made more smart and automatic in the future.

- Fingerprint or face recognition can be added for more security.
- SMS or email can be sent to parents when a student is absent.
- A mobile app can be developed for teachers and students.
- Attendance reports can be downloaded as Excel or PDF files.
- Subject-wise and monthly attendance percentage can be shown.
- Data can be stored on a cloud server for use from anywhere.

## Chapter 9: Challenges and Learning

During the development of this project, we faced several challenges while working with both hardware and software parts of the system. One of the main difficulties was connecting the RFID reader RC522 with the NodeMCU, as it has many pins and even one wrong connection stopped the card from being read. We also had to be careful because the RC522 works on 3.3V and not on 5V. Sometimes the NodeMCU did not connect to the Wi-Fi due to wrong password or weak network. Another challenge was sending the data to the web application, as the NodeMCU needs the IP address of the computer and not the word localhost, and both had to be on the same network. At times the same card was scanned many times and saved again, so we had to correct the code to avoid this. There were also errors while connecting the server with MongoDB and while showing data on the React page. These issues required patience, repeated testing and careful checking to find and fix the errors.

Through this project, we gained valuable practical knowledge and hands-on experience in building an IoT-based system. We learned how RFID technology works, how to connect a reader with the microcontroller, and how to write and upload code to the NodeMCU. We also understood how data goes from a hardware device to a web server through Wi-Fi, and how a MERN stack application stores and shows this data. This project improved our problem-solving skills, as we had to find and correct mistakes on our own. It also helped us understand the importance of proper planning, correct connections and testing at every stage. Overall, this project increased our confidence in working with electronics, IoT and web development, and gave us a clear idea of how such systems can be used in real-life applications.

## Chapter 10: Conclusion

The IoT-based project RFID - READER BASED ATTENDANCE SYSTEM USING MERN STACK using the NodeMCU ESP8266, RFID reader RC522 and a MERN stack web application successfully shows how student attendance can be taken automatically. The system was tested properly and achieved all the expected objectives. The attendance was marked by just scanning the card and the records were shown to the teacher on a web page.

- **Easy and Fast Attendance**  
  The student only has to scan the card, so attendance is marked in a few seconds without calling names one by one.

- **Saves Time and Effort**  
  The system reduces the manual work of the teacher as there is no need to write the attendance in a register or enter it again in a computer.

- **Reduces Errors**  
  Every card has a unique ID, so wrong entries are less and one student cannot easily mark attendance for another student without the card.

- **Easy Monitoring of Records**  
  Attendance is stored in the database and teachers can check it anytime on the web page along with date and time.

- **Low Cost and User-Friendly**  
  The system uses cheap components and is simple to use. It does not require any technical knowledge from teachers or students.

## References

- ESP8266 Arduino Core Documentation - [https://arduino-esp8266.readthedocs.io/](https://arduino-esp8266.readthedocs.io/)
- MFRC522 RFID Library for Arduino (GitHub) - [https://github.com/miguelbalboa/rfid](https://github.com/miguelbalboa/rfid)
- MongoDB Manual - [https://www.mongodb.com/docs/manual/](https://www.mongodb.com/docs/manual/)
- Express.js Official Website - [https://expressjs.com/](https://expressjs.com/)
- React Official Documentation - [https://react.dev/](https://react.dev/)
- Node.js Official Documentation - [https://nodejs.org/en/docs](https://nodejs.org/en/docs)
