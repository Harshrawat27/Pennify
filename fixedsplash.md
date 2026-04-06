Update(app/\_layout.tsx)  
 ⎿  Added 13 lines  
 39 setHasLaunched(val === 'true');  
 40 });
41 }, []);  
 42 +  
 43 + // Fast-open: if user was previously authenticated, route to
+tabs instantly  
 44 + // without waiting for network. Session validates in backgrou
+nd — if expired,  
 45 + // the normal flow below will redirect to sign-in.  
 46 + useEffect(() => {  
 47 + AsyncStorage.getItem(WAS_AUTHENTICATED_KEY).then((wasAuth)
+=> {  
 48 + if (wasAuth === 'true' && !splashHidden.current) {  
 49 + splashHidden.current = true;  
 50 + router.replace('/(tabs)');  
 51 + SplashScreen.hideAsync();  
 52 + }  
 53 + });  
 54 + }, []);  
 55 // prevSubStatus tracks changes after initial routing to re-r
oute on purchase
56
