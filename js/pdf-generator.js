/* ================================================
   PDF INVOICE GENERATOR SERVICE
   Supports Teacher (EGP) and Student/Family (USD)
   Requires html2pdf.bundle.min.js loaded in DOM.
   ================================================ */

window.generateTeacherInvoicePDF = function(teacherId, fromDate, toDate) {
    if (typeof html2pdf === 'undefined') {
        UI.toast("PDF generator library not loaded yet. Check internet connection.", "error");
        return;
    }

    const t = DB.getTeacher(teacherId);
    if (!t) return;
    
    // get sessions
    let sessions = DB.getSessions({ teacherId: t.id }).filter(s => s.status === 'completed');
    if (fromDate) sessions = sessions.filter(s => s.date >= fromDate);
    if (toDate) sessions = sessions.filter(s => s.date <= toDate);
    
    const rate = t.sessionRate || 100;
    const totalDue = sessions.length * rate;

    const dateStr = fromDate ? `${UI.fmt.dateShort(fromDate)} to ${toDate ? UI.fmt.dateShort(toDate) : 'Present'}` : 'All Time';
    const issueDate = UI.fmt.dateShort(new Date().toISOString().split('T')[0]);
    const invNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const tableRows = sessions.map(s => {
        return `
        <tr>
            <td style="padding:10px; border-bottom:1px solid #ddd;">${UI.fmt.dateShort(s.date)}</td>
            <td style="padding:10px; border-bottom:1px solid #ddd;">${s.courseType}</td>
            <td style="padding:10px; border-bottom:1px solid #ddd; text-align:center;">${s.duration} mins</td>
            <td style="padding:10px; border-bottom:1px solid #ddd; text-align:right;">${rate} EGP</td>
        </tr>`;
    }).join('');

    const html = `
    <div style="font-family: 'Inter', 'Amiri', sans-serif; max-width: 800px; padding: 40px; background:#fff; color:#111; direction:ltr;">
        <div style="display:flex; justify-content:space-between; border-bottom: 2px solid #8B6914; padding-bottom: 20px; align-items:flex-start;">
            <div>
                <h1 style="margin:0; font-size:28px; color: #8B6914; font-weight:900;">Dar Al-Arqam Academy</h1>
                <h2 style="margin:0; font-size:22px; color: #8B6914; font-family:'Amiri', serif;" dir="rtl">أكاديمية دار الأرقم</h2>
            </div>
            <div style="text-align:right;">
                <h2 style="margin:0; font-size:24px; color:#333;">INVOICE</h2>
                <div style="margin-top:8px; font-size:14px; color:#555;"><strong>Issue Date:</strong> ${issueDate}</div>
                <div style="font-size:14px; color:#555;"><strong>Invoice #:</strong> ${invNumber}</div>
            </div>
        </div>

        <div style="margin-top:30px; display:flex; justify-content:space-between;">
            <div>
                <p style="margin:0; font-size:12px; color:#777; text-transform:uppercase;">Pay To (Teacher):</p>
                <div style="font-size:18px; font-weight:bold; color:#111; margin-top:4px;">${t.name}</div>
                <div style="font-size:14px; color:#8B6914; font-weight:bold;">${t.id}</div>
            </div>
            <div style="text-align:right;">
                <p style="margin:0; font-size:12px; color:#777; text-transform:uppercase;">Billing Period:</p>
                <div style="font-size:16px; font-weight:bold; color:#111; margin-top:4px;">${dateStr}</div>
            </div>
        </div>

        <div style="margin-top: 40px;">
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
                <thead>
                    <tr style="background:#f9f9f9; text-align:left;">
                        <th style="padding:10px; border-bottom:2px solid #ddd;">Date</th>
                        <th style="padding:10px; border-bottom:2px solid #ddd;">Course Type</th>
                        <th style="padding:10px; border-bottom:2px solid #ddd; text-align:center;">Duration</th>
                        <th style="padding:10px; border-bottom:2px solid #ddd; text-align:right;">Amount (EGP)</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows || '<tr><td colspan="4" style="padding:20px; text-align:center; color:#777;">No completed sessions found for this period.</td></tr>'}
                </tbody>
            </table>
        </div>

        <div style="margin-top:20px; display:flex; justify-content:flex-end;">
            <div style="width:300px;">
                <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #ddd;">
                    <span style="font-weight:bold;">Total Sessions:</span>
                    <span>${sessions.length}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:15px 0; font-size:20px; color:#8B6914;">
                    <span style="font-weight:900;">Total Due:</span>
                    <span style="font-weight:900;">${totalDue} EGP</span>
                </div>
            </div>
        </div>

        <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; text-align:center;">
            <p style="font-size:14px; color:#555; margin:0; font-family:'Inter', sans-serif;">Thank you for your trust</p>
            <p style="font-size:18px; color:#8B6914; margin:5px 0 0 0; font-family:'Amiri', serif;" dir="rtl">شكراً لثقتكم</p>
            <p style="font-size:12px; color:#999; margin-top:15px;">contact@daralarqam.com | +20-123-456-7890</p>
        </div>
    </div>
    `;

    executePdfGeneration(html, `Invoice_${t.name.replace(/\s+/g,'_')}_${issueDate}.pdf`);
};

window.generateStudentInvoicePDF = function(familyOrStudentId, fromDate, toDate) {
    if (typeof html2pdf === 'undefined') {
        UI.toast("PDF generator library not loaded yet. Check internet connection.", "error");
        return;
    }

    let isFamily = familyOrStudentId.startsWith('FAM');
    let f = null;
    let targetStudents = [];

    if (isFamily) {
        f = DB.getFamily(familyOrStudentId);
        targetStudents = DB.getStudents({familyId: f.id});
    } else {
        const s = DB.getStudent(familyOrStudentId);
        targetStudents = [s];
        f = DB.getFamily(s.familyId) || {name: 'Independent', id: 'N/A'};
    }

    const dateStr = fromDate ? `${UI.fmt.dateShort(fromDate)} to ${toDate ? UI.fmt.dateShort(toDate) : 'Present'}` : 'All Time';
    const issueDate = UI.fmt.dateShort(new Date().toISOString().split('T')[0]);
    const invNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let grandTotal = 0;
    
    // Group rows by student
    let tableRows = '';
    targetStudents.forEach(stu => {
        let sessions = DB.getSessions({ studentId: stu.id }).filter(s => s.status === 'completed');
        if (fromDate) sessions = sessions.filter(s => s.date >= fromDate);
        if (toDate) sessions = sessions.filter(s => s.date <= toDate);
        
        if (sessions.length === 0) return;

        const rate = stu.sessionRate || 6;
        const subtotal = sessions.length * rate;
        grandTotal += subtotal;

        tableRows += `<tr style="background:#fefefe;"><td colspan="5" style="padding:10px 5px; font-weight:bold; color:#8B6914; border-bottom:1px solid #eee;">Student: ${stu.name} (${stu.id}) - Rate: $${rate}/session</td></tr>`;
        
        sessions.forEach(s => {
            const tInfo = DB.getTeacher(s.teacherId);
            const tName = tInfo ? tInfo.name.split(' ')[0] : 'Instructor';
            tableRows += `
            <tr>
                <td style="padding:8px 5px; border-bottom:1px solid #ddd;">${UI.fmt.dateShort(s.date)}</td>
                <td style="padding:8px 5px; border-bottom:1px solid #ddd;">${s.courseType}</td>
                <td style="padding:8px 5px; border-bottom:1px solid #ddd;">${tName}</td>
                <td style="padding:8px 5px; border-bottom:1px solid #ddd; text-align:center;">${s.duration} min</td>
                <td style="padding:8px 5px; border-bottom:1px solid #ddd; text-align:right;">$ ${rate}</td>
            </tr>`;
        });
    });

    const html = `
    <div style="font-family: 'Inter', 'Amiri', sans-serif; max-width: 800px; padding: 40px; background:#fff; color:#111; direction:ltr;">
        <div style="display:flex; justify-content:space-between; border-bottom: 2px solid #8B6914; padding-bottom: 20px; align-items:flex-start;">
            <div>
                <h1 style="margin:0; font-size:28px; color: #8B6914; font-weight:900;">Dar Al-Arqam Academy</h1>
                <h2 style="margin:0; font-size:22px; color: #8B6914; font-family:'Amiri', serif;" dir="rtl">أكاديمية دار الأرقم</h2>
            </div>
            <div style="text-align:right;">
                <h2 style="margin:0; font-size:24px; color:#333;">INVOICE</h2>
                <div style="margin-top:8px; font-size:14px; color:#555;"><strong>Issue Date:</strong> ${issueDate}</div>
                <div style="font-size:14px; color:#555;"><strong>Invoice #:</strong> ${invNumber}</div>
            </div>
        </div>

        <div style="margin-top:30px; display:flex; justify-content:space-between;">
            <div>
                <p style="margin:0; font-size:12px; color:#777; text-transform:uppercase;">Bill To (Family/Student):</p>
                <div style="font-size:18px; font-weight:bold; color:#111; margin-top:4px;">${f.name}</div>
                <div style="font-size:14px; color:#8B6914; font-weight:bold;">${f.id}</div>
            </div>
            <div style="text-align:right;">
                <p style="margin:0; font-size:12px; color:#777; text-transform:uppercase;">Billing Period:</p>
                <div style="font-size:16px; font-weight:bold; color:#111; margin-top:4px;">${dateStr}</div>
            </div>
        </div>

        <div style="margin-top: 40px;">
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
                <thead>
                    <tr style="background:#f9f9f9; text-align:left;">
                        <th style="padding:10px 5px; border-bottom:2px solid #ddd;">Date</th>
                        <th style="padding:10px 5px; border-bottom:2px solid #ddd;">Subject</th>
                        <th style="padding:10px 5px; border-bottom:2px solid #ddd;">Teacher</th>
                        <th style="padding:10px 5px; border-bottom:2px solid #ddd; text-align:center;">Duration</th>
                        <th style="padding:10px 5px; border-bottom:2px solid #ddd; text-align:right;">Amount (USD)</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows || '<tr><td colspan="5" style="padding:20px; text-align:center; color:#777;">No completed sessions found for this period.</td></tr>'}
                </tbody>
            </table>
        </div>

        <div style="margin-top:20px; display:flex; justify-content:flex-end;">
            <div style="width:300px;">
                <div style="display:flex; justify-content:space-between; padding:15px 0; font-size:20px; color:#8B6914; border-bottom:2px solid #111;">
                    <span style="font-weight:900;">Family Grand Total:</span>
                    <span style="font-weight:900;">$ ${grandTotal}</span>
                </div>
            </div>
        </div>

        <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; text-align:center;">
            <p style="font-size:14px; color:#555; margin:0; font-family:'Inter', sans-serif;">Thank you for your trust</p>
            <p style="font-size:18px; color:#8B6914; margin:5px 0 0 0; font-family:'Amiri', serif;" dir="rtl">شكراً لثقتكم</p>
            <p style="font-size:12px; color:#999; margin-top:15px;">contact@daralarqam.com | +20-123-456-7890</p>
        </div>
    </div>
    `;

    executePdfGeneration(html, `Invoice_Family_${f.id}_${issueDate}.pdf`);
};

function executePdfGeneration(htmlContent, filename) {
    const container = document.getElementById('invoice-print-container');
    if (!container) return; // Fail silent, though should not happen based on index.html
    
    container.innerHTML = htmlContent;
    container.style.display = 'block'; // Make visible temporarily to render 
    
    const opt = {
        margin:       0.5,
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    UI.toast("Generating PDF Invoice...", "info");
    
    html2pdf().set(opt).from(container).save().then(() => {
        container.style.display = 'none';
        container.innerHTML = ''; // cleanup
        UI.toast("Invoice downloaded successfully!", "success");
    }).catch(err => {
        container.style.display = 'none';
        UI.toast("Error generating PDF: " + err, "error");
    });
}
