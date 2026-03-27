@echo off
REM AU Events Auto-Test
cd /d "%~dp0"

REM Create test HTML
echo ^<!DOCTYPE html^>^<html^>^<head^>^<title^>AU Events Test^</title^>^</head^>^<body^>^<script^> > test-data.html
echo var id='EVT'+Date.now().toString(36).toUpperCase(); >> test-data.html
echo var org='ORG'+Date.now().toString(36).toUpperCase(); >> test-data.html
echo var d=new Date(); d.setDate(d.getDate()+14); >> test-data.html
echo var dl=new Date(); dl.setDate(dl.getDate()+12); >> test-data.html
echo var e={id:id,name:'Tech Conference 2026',description:'Amazing tech event.',date:d.toISOString().slice(0,16),deadline:dl.toISOString().slice(0,16),location:'Anna University Main Auditorium',category:'Workshop',contactEmail:'test@au.edu',contactPhone:'9876543210',banner:'',organizerId:org}; >> test-data.html
echo localStorage.setItem('ef_events',JSON.stringify([e])); >> test-data.html
echo localStorage.setItem('ef_organizer_id',org); >> test-data.html
echo document.body.innerHTML='^<h1 style=\"color:#4ade80;font-family:Arial\"^>Event Created!^</h1^>^<p style=\"font-family:Arial\"^>Opening event page...^</p^>'; >> test-data.html
echo setTimeout(function(){window.location='index.html#event/'+id},1500); >> test-data.html
echo ^</script^>^</body^>^</html^> >> test-data.html

start "" "test-data.html"
echo Test event created! Check browser.
pause
