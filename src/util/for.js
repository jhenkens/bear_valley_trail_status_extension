function show(cr_picker, enabled) {
    cr_picker.querySelector('ul').classList.toggle('show', enabled);
    cr_picker.querySelector('div.dropdown').classList.toggle('show', enabled);
}
function selectTime(cr_picker, time) {
    show(cr_picker, true);
    [...cr_picker.querySelectorAll('li span')]
        .filter((a) => a.textContent === time)
        .map((e) => e.closest('a'))[0]
        .click();
    show(cr_picker, false);
}

const mountain_area = document
    .querySelector('input[placeholder="Mountain Area"]')
    .value.trim()
    .toLowerCase();
const end_time =
    mountain_area.indexOf('backside') >= 0 ||
    mountain_area.indexOf('lower mountain') >= 0
        ? '3:30 PM'
        : '4:00 PM';
[...document.querySelectorAll('cr-time-picker')]
    .filter((e) => e.hasAttribute('ng-reflect-name'))
    .map((e) => [
        e,
        e.querySelector('input'),
        e.getAttribute('ng-reflect-name').endsWith('_open'),
    ])
    .filter(([e, i, o]) => i.value == '')
    .forEach(([e, i, o]) => {
        i.focus();
        selectTime(e, o ? '9:00 AM' : end_time);
        i.blur();
    });
