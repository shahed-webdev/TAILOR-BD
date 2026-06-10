// Delete Order Item
function deleteOrderItem(index) {
    const item = orderItems[index];
    
    if (!confirm(`"${item.dress.dressName}" মুছে ফেলবেন?`)) {
        return;
    }

    // If it's an existing order item, mark it for deletion
    if (item.orderListId) {
        deletedOrderListIds.push(item.orderListId);
        console.log('🗑️ Marked order item for deletion:', item.orderListId);
    }

    // Remove from array
    orderItems.splice(index, 1);
    
    console.log('✅ Order item deleted:', item.dress.dressName);
    renderOrderItems();
}

// Open Measurement Modal
async function openMeasurementModal(index) {
    console.log('📏 Opening measurement modal for dress index:', index);
    
    currentEditingIndex = index;
    const item = orderItems[index];
    
    console.log('📦 Dress item:', {
        dressName: item.dress.dressName,
        dressId: item.dress.dressId,
        orderListId: item.orderListId,
        hasMeasurements: !!item.measurements && item.measurements.length > 0
    });
    
    // FIXED: Load measurements for this specific order list item
    showLoading();
    try {
        // FIXED: Add orderListId parameter if this is an existing order item
        let apiUrl = `/api/measurements/dress-details?dressId=${item.dress.dressId}&customerId=${orderData.customerId}&institutionId=${institutionId}`;
        
        if (item.orderListId) {
            apiUrl += `&orderListId=${item.orderListId}`;
            console.log('  📋 Loading ordered measurements for OrderListID:', item.orderListId);
        } else {
            console.log('  📋 Loading customer saved measurements (new dress)');
        }
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        
        const result = await response.json();
        console.log('  📦 API result:', result);
        
        if (result.success && result.data && result.data.measurements) {
            item.measurements = result.data.measurements;
            console.log('✅ Loaded measurements:', item.measurements.length, 'groups');
            console.log('  Measurements data:', item.measurements);
        } else {
            console.warn('⚠️ No measurements found');
            item.measurements = [];
        }
    } catch (error) {
        console.error('❌ Error loading measurements:', error);
        alert('মাপ লোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
        item.measurements = [];
    } finally {
        hideLoading();
    }
    
    // Update modal title - FIXED: Add null check
    const modalTitle = document.getElementById('modalMeasurementDressName');
    if (modalTitle) {
        modalTitle.textContent = item.dress.dressName + ' - মাপ';
    }
    
    // Render measurements
    renderMeasurements();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('measurementModal'));
    modal.show();
}

// Render Measurements
function renderMeasurements() {
    if (currentEditingIndex === null) return;

    const item = orderItems[currentEditingIndex];
    const container = document.getElementById('measurementsContainer');

    if (!container) {
        console.error('❌ measurementsContainer not found');
        return;
    }

    if (!item.measurements || item.measurements.length === 0) {
        container.innerHTML = '<p class="text-center text-muted py-3">এই পোশাকের জন্য কোন মাপ পাওয়া যায়নি</p>';
        return;
    }

    const measurementsHTML = item.measurements.map((group, groupIndex) => {
        const groupItems = group.measurements.map(m => `
            <div class="measurement-item-old">
                <label class="measurement-label-old">${m.measurementTypeName}</label>
                <input type="text" 
                       class="form-control measurement-input-old" 
                       value="${m.measurement || ''}"
                       placeholder=""
                       onchange="updateMeasurement(${groupIndex}, ${m.measurementTypeID}, this.value)">
            </div>
        `).join('');

        return `
            <div class="measurement-group-row-old">
                ${groupItems}
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="measurements-container-old">${measurementsHTML}</div>`;
    
    console.log('✅ Rendered measurements for', item.dress.dressName);
}

// Update Measurement
function updateMeasurement(groupIndex, measurementTypeId, value) {
    if (currentEditingIndex === null) return;

    const item = orderItems[currentEditingIndex];
    const measurementGroup = item.measurements[groupIndex];
    const measurement = measurementGroup.measurements.find(m => m.measurementTypeID === measurementTypeId);

    if (measurement) {
        measurement.measurement = value;
        console.log('✏️ Updated measurement:', measurement.measurementTypeName, '=', value);
    }
}

// Save Measurements - reads all current input values from modal
function saveMeasurements() {
    if (currentEditingIndex === null) return;

    const container = document.getElementById('measurementsContainer');
    if (!container) return;

    const inputs = container.querySelectorAll('.measurement-input-old');
    inputs.forEach(input => {
        const onchangeAttr = input.getAttribute('onchange');
        if (onchangeAttr) {
            // Extract groupIndex and measurementTypeId from onchange attribute
            const match = onchangeAttr.match(/updateMeasurement\((\d+),\s*(\d+),/);
            if (match) {
                const groupIndex = parseInt(match[1]);
                const measurementTypeId = parseInt(match[2]);
                updateMeasurement(groupIndex, measurementTypeId, input.value);
            }
        }
    });

    console.log('✅ Measurements saved successfully');
    alert('মাপ সফলভাবে সংরক্ষণ করা হয়েছে');
}

// Open Style Modal
async function openStyleModal(index) {
    console.log('🎨 Opening style modal for dress index:', index);
    
    currentEditingIndex = index;
    const item = orderItems[index];
    
    console.log('📦 Dress item:', {
        dressName: item.dress.dressName,
        dressId: item.dress.dressId,
        orderListId: item.orderListId,
        hasStyles: !!item.styles && item.styles.length > 0
    });
    
    // FIXED: Load styles for this specific order list item
    showLoading();
    try {
        // FIXED: Add orderListId parameter if this is an existing order item
        let apiUrl = `/api/measurements/dress-details?dressId=${item.dress.dressId}&customerId=${orderData.customerId}&institutionId=${institutionId}`;
        
        if (item.orderListId) {
            apiUrl += `&orderListId=${item.orderListId}`;
            console.log('  📋 Loading ordered styles for OrderListID:', item.orderListId);
        } else {
            console.log('  📋 Loading customer saved styles (new dress)');
        }
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        
        const result = await response.json();
        console.log('  📦 API result:', result);
        
        if (result.success && result.data && result.data.styles) {
            item.styles = result.data.styles;
            console.log('✅ Loaded styles:', item.styles.length, 'groups');
            console.log('  Styles data:', item.styles);
        } else {
            console.warn('⚠️ No styles found');
            item.styles = [];
        }
    } catch (error) {
        console.error('❌ Error loading styles:', error);
        alert('স্টাইল লোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
        item.styles = [];
    } finally {
        hideLoading();
    }
    
    // Update modal title - FIXED: Add null check
    const modalTitle = document.getElementById('modalStyleDressName');
    if (modalTitle) {
        modalTitle.textContent = item.dress.dressName + ' - স্টাইল';
    }
    
    // Render styles
    renderStyles();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('styleModal'));
    modal.show();
}

// Render Styles
function renderStyles() {
    if (currentEditingIndex === null) return;
    
    const item = orderItems[currentEditingIndex];
    const container = document.getElementById('stylesContainer');
    
    if (!container) {
        console.error('❌ stylesContainer not found');
        return;
    }
    
    if (!item.styles || item.styles.length === 0) {
        container.innerHTML = '<p class="text-center text-muted py-3">এই পোশাকের জন্য কোন স্টাইল পাওয়া যায়নি</p>';
        return;
    }
    
    const stylesHTML = item.styles.map((group, groupIndex) => `
        <div class="style-category mb-3">
            <div class="style-category-header">
                <h6 class="mb-0">
                    <i class="fas fa-chevron-right me-2"></i>
                    ${group.groupName}
                </h6>
            </div>
            <div class="style-items">
                ${group.styles.map(style => `
                    <div class="style-item">
                        <div class="row align-items-center">
                            <div class="col-md-5">
                                <div class="form-check">
                                    <input class="form-check-input custom-checkbox" 
                                           type="checkbox" 
                                           id="style_${style.dressStyleId}"
                                           ${style.isCheck ? 'checked' : ''}
                                           onchange="updateStyleCheck(${groupIndex}, ${style.dressStyleId}, this.checked)">
                                    <label class="form-check-label" for="style_${style.dressStyleId}">
                                        ${style.dressStyleName}
                                    </label>
                                </div>
                            </div>
                            <div class="col-md-7">
                                <input type="text" 
                                       class="form-control form-control-sm" 
                                       placeholder="বিস্তারিত লিখুন..."
                                       value="${style.dressStyleMeasurement || ''}"
                                       ${!style.isCheck ? 'disabled' : ''}
                                       onchange="updateStyleMeasurement(${groupIndex}, ${style.dressStyleId}, this.value)">
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = stylesHTML;
    
    console.log('✅ Rendered styles for', item.dress.dressName);
}

// Update Style Check
function updateStyleCheck(groupIndex, styleId, isChecked) {
    if (currentEditingIndex === null) return;
    
    const item = orderItems[currentEditingIndex];
    const styleGroup = item.styles[groupIndex];
    const style = styleGroup.styles.find(s => s.dressStyleId === styleId);
    
    if (style) {
        style.isCheck = isChecked;
        if (!isChecked) {
            style.dressStyleMeasurement = '';
        }
        console.log('✏️ Updated style check:', style.dressStyleName, '=', isChecked);
        
        // FIXED: Re-render to update disabled state of input field
        renderStyles();
    }
}

// Update Style Measurement
function updateStyleMeasurement(groupIndex, styleId, value) {
    if (currentEditingIndex === null) return;
    
    const item = orderItems[currentEditingIndex];
    const styleGroup = item.styles[groupIndex];
    const style = styleGroup.styles.find(s => s.dressStyleId === styleId);
    
    if (style) {
        style.dressStyleMeasurement = value;
        console.log('✏️ Updated style measurement:', style.dressStyleName, '=', value);
    }
}

// Save Styles (called when clicking "সংরক্ষণ করুন" button)
function saveStyles() {
    if (currentEditingIndex === null) return;
    
    const item = orderItems[currentEditingIndex];
    console.log('💾 Saving styles for:', item.dress.dressName);
    console.log('  Total style groups:', item.styles?.length || 0);
    
    // Count selected styles
    let selectedCount = 0;
    if (item.styles) {
        item.styles.forEach(group => {
            if (group.styles) {
                group.styles.forEach(s => {
                    if (s.isCheck) selectedCount++;
                });
            }
        });
    }
    
    console.log('  Selected styles:', selectedCount);
    console.log('✅ Styles saved successfully');
    
    // Show success message
    alert('স্টাইল সফলভাবে সংরক্ষণ করা হয়েছে');
}

// Submit Order (Update)
async function submitOrderUpdate() {
    try {
        console.log('🚀 Starting order update submission...');
        console.log('📊 Current state:', {
            orderItems: orderItems.length,
            deletedOrderListIds: deletedOrderListIds.length,
            deletedOrderPaymentIds: deletedOrderPaymentIds.length
        });
        
        if (orderItems.length === 0) {
            alert('অন্তত একটি পোশাক থাকতে হবে');
            return;
        }

        showLoading();

        // Prepare OrderList data
        const orderListData = orderItems.map((item, idx) => {
            console.log(`  📦 Processing item ${idx + 1}:`, {
                dressName: item.dress.dressName,
                orderListId: item.orderListId,
                measurements: item.measurements?.length || 0,
                styles: item.styles?.length || 0,
                payments: item.payments?.length || 0
            });
            
            // Prepare measurements
            const measurements = [];
            if (item.measurements) {
                item.measurements.forEach(group => {
                    if (group.measurements) {
                        group.measurements.forEach(m => {
                            if (m.measurement && m.measurement.trim() !== '') {
                                measurements.push({
                                    id: m.measurementTypeID,
                                    value: m.measurement
                                });
                            }
                        });
                    }
                });
            }
            console.log(`    📏 Measurements prepared: ${measurements.length}`);

            // Prepare styles
            const styles = [];
            if (item.styles) {
                item.styles.forEach(group => {
                    if (group.styles) {
                        group.styles.forEach(s => {
                            if (s.isCheck) {
                                styles.push({
                                    id: s.dressStyleId,
                                    value: s.dressStyleMeasurement || ''
                                });
                            }
                        });
                    }
                });
            }
            console.log(`    🎨 Styles prepared: ${styles.length}`);

            // Prepare payments (only new ones without OrderPaymentId)
            const newPayments = item.payments ? item.payments.filter(p => !p.OrderPaymentId).map(p => {
                console.log(`      💰 New payment: ${p.For} - ${p.Quantity} × ${p.UnitPrice}`);
                return {
                    For: p.For,
                    Unit_Price: p.UnitPrice,
                    Quantity: p.Quantity
                };
            }) : [];
            console.log(`    💵 New payments prepared: ${newPayments.length}`);

            return {
                OrderListId: item.orderListId || null,
                DressId: item.dress.dressId,
                DressQuantity: item.quantity,
                Details: item.orderDetails || '',
                ListMeasurement: JSON.stringify(measurements),
                ListStyle: JSON.stringify(styles),
                ListPayment: JSON.stringify(newPayments)
            };
        });

        console.log('📋 OrderList data prepared:', orderListData);

        // Prepare request body - match the expected format from .NET 8 API
        const requestBody = {
            OrderId: orderData.orderId,
            InstitutionId: parseInt(institutionId),
            RegistrationId: parseInt(registrationId),
            ClothForId: orderData.clothForId,
            CustomerId: orderData.customerId,
            DeletedOrderListIds: deletedOrderListIds,  // Send as array of integers
            DeletedOrderPaymentIds: deletedOrderPaymentIds,  // Send as array of integers
            OrderList: orderListData
        };

        console.log('📤 Submitting order update:');
        console.log('  Order ID:', requestBody.OrderId);
        console.log('  Customer ID:', requestBody.CustomerId);
        console.log('  Order Items:', requestBody.OrderList.length);
        console.log('  Deleted Items (raw):', deletedOrderListIds);
        console.log('  Deleted Items (in body):', requestBody.DeletedOrderListIds);
        console.log('  Deleted Payments (raw):', deletedOrderPaymentIds);
        console.log('  Deleted Payments (in body):', requestBody.DeletedOrderPaymentIds);
        console.log('  Full request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`/api/orders/${orderData.orderId}/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('📡 Response status:', response.status, response.statusText);
        console.log('📡 Response headers:', [...response.headers.entries()]);

        const responseText = await response.text();
        console.log('📡 Response text (first 500 chars):', responseText.substring(0, 500));

        if (!response.ok) {
            console.error('❌ Server error response:', responseText);
            throw new Error(`Server returned ${response.status}: ${responseText.substring(0, 200)}`);
        }

        let result;
        try {
            result = JSON.parse(responseText);
            console.log('✅ Parsed response:', result);
        } catch (parseError) {
            console.error('❌ Failed to parse response as JSON:', parseError);
            console.error('❌ Response was:', responseText);
            throw new Error('Server did not return valid JSON. Response: ' + responseText.substring(0, 100));
        }

        if (result.success) {
            console.log('✅ Order updated successfully!');
            alert('অর্ডার সফলভাবে আপডেট হয়েছে');
            // Redirect to finish-order page
            window.location.href = `/finish-order.html?orderId=${orderData.orderId}`;
        } else {
            console.error('❌ Server reported failure:', result.message);
            alert('অর্ডার আপডেট করতে ব্যর্থ হয়েছে: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('💥 Error submitting order:', error);
        console.error('💥 Error stack:', error.stack);
        alert('অর্ডার আপডেট করতে সমস্যা হয়েছে: ' + error.message);
    } finally {
        hideLoading();
    }
}
