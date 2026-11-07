
 ================================================================================
 =                                                                              =
 = SSSS U  U PPPP EEEE RRRR   M   M  AA  RRRR III  OO    BBB  RRRR  OO  SSSS    =
 = S    U  U P  P E    R  R   MM MM A  A R  R  I  O  O   B  B R  R O  O S       =
 = SSSS U  U PPPP EEE  RRRR   M M M AAAA RRRR  I  O  O   BBB  RRRR O  O SSSS    =
 =    S U  U P    E    R R    M   M A  A R R   I  O  O   B  B R R  O  O    S    =
 = SSSS UUUU P    EEEE R  R   M   M A  A R  R III  OO    BBB  R  R  OO  SSSS .  =
 =                                                                              =
 =                         P U R E   C O N T R O L S                            =
 =                                                                              =
 =                     a Super Mario Bros. (NES) rom hack                       =
 =                   un rom hack de Super Mario Bros. (NES)                     =
 =                                                                              =
 ================================================================================


   ROM de base / Base ROM  . .  Super Mario Bros. (World).nes
   Patch . . . . . . . . . . .  format IPS


 ##############################################################################
 #                                                                            #
 #                              E N G L I S H                                 #
 #                                                                            #
 ##############################################################################


        "The same game, just nicer to play."


 ------------------------------------------------------------------------------
   T H E   I D E A
 ------------------------------------------------------------------------------

   The goal of PURE CONTROLS is to modernise the way Super Mario Bros.
   plays: the enjoyment, the feel, the experience with a pad in hand.

   I also took the opportunity to improve the game's visuals and sound.


 ==============================================================================
   [ 01 ]   G R A P H I C S
 ==============================================================================

   [ ADDED ]  Character and enemy sprites imported from
              PASTEL SUPER MARIO BROS. (SOLVALOU ART), lightly retouched
   [CHANGED]  Full recolor of the whole game
   [CHANGED]  Several scenery elements redrawn
   [ ADDED ]  Piranha Plant redrawn


 ==============================================================================
   [ 02 ]   P H Y S I C S   A N D   C O N T R O L S
 ==============================================================================

   [CHANGED]  Sprint speed +10%
   [CHANGED]  Reduced inertia: less skidding, top speed reached sooner
   [ ADDED ]  Improved air control
   [ ADDED ]  Turn around in mid-air


 ==============================================================================
   [ 03 ]   G A M E P L A Y
 ==============================================================================

   [ ADDED ]  Ability to pick up and carry shells
   [ ADDED ]  Variable bounce on enemies (hold A to bounce higher)
   [ ADDED ]  Pressing A too early no longer wastes the jump: it fires the
              moment Mario lands
   [CHANGED]  Fire Mario returns to big when hit, instead of small
   [ ADDED ]  Extra life on the 7th enemy killed by a shell
   [ ADDED ]  Extra life on the 10th enemy under a star, then every one after
   [ ADDED ]  Konami code: skip a level with the Select button
              Up Up Down Down Left Right Left Right B A


 ==============================================================================
   [ 04 ]   L E V E L S   A N D   S C E N E R Y
 ==============================================================================

   [ ADDED ]  Snow levels, in day and night versions
   [ ADDED ]  Animated starfield in night and underground levels
   [CHANGED]  A few scenery elements changed
   [CHANGED]  1-3 has its own level data (it used to share with 5-3)


 ==============================================================================
   [ 05 ]   M E N U   A N D   M O D E S
 ==============================================================================

   [ ADDED ]  Luigi playable on his own, no need for the 2-player mode
   [CHANGED]  Menu driven with the d-pad, with a cursor and sounds
   [ ADDED ]  Luigi shown on the title screen in two-brother mode
   [ ADDED ]  CONTINUE / END menu on game over
   [ ADDED ]  Two credits screens on boot


 ==============================================================================
   [ 06 ]   S O U N D   A N D   M U S I C
 ==============================================================================

   [CHANGED]  Music edited throughout the game
   [CHANGED]  Instruments and voicings replaced
   [ ADDED ]  Sampled drums (DPCM): a real kick and a real snare
   [ ADDED ]  Vibrato on held notes
   [ ADDED ]  Cave echo in the underground levels
   [ ADDED ]  Sounds on the title menu


 ==============================================================================
   [ 07 ]   U N D E R   T H E   H O O D
 ==============================================================================

   [CHANGED]  Moved to the MMC3 mapper: twice the code space and switchable
              graphics. Everything above depended on it.
   [CHANGED]  The status bar split is handled by the mapper instead of a
              wait loop -- no flicker, and time given back to the game
   [ ADDED ]  Graphics are edited as PNG files and injected at build time


 ==============================================================================
   [ 08 ]   C R E D I T S
 ==============================================================================

     SOLVALOU ART . . . . . . . . . . . . . .  Character sprites
     KUATO . . . . . . . . . . . . . . . . .   Gameplay, recolor, additional
                                               graphic art, music edits,
                                               Piranha Plant

     Super Mario Bros. is the property of Nintendo.
     This hack is a free, unofficial, fan-made work.




 ##############################################################################
 #                                                                            #
 #                              F R A N Ç A I S                               #
 #                                                                            #
 ##############################################################################


        "Le même jeu, en plus agréable à jouer."


 ------------------------------------------------------------------------------
   L' I D É E
 ------------------------------------------------------------------------------

   L'objectif de PURE CONTROLS est de moderniser l'expérience de jeu de
   Super Mario Bros. : le plaisir de jouer, le feeling, la sensation
   manette en main.

   J'en ai profité pour améliorer aussi l'aspect visuel et sonore du jeu.


 ==============================================================================
   [ 01 ]   G R A P H I S M E S
 ==============================================================================

   [ AJOUT ]  Sprites de personnages et d'ennemis importés de
              PASTEL SUPER MARIO BROS. (SOLVALOU ART), légèrement retouchés
   [ MODIF ]  Recolorisation intégrale du jeu
   [ MODIF ]  Plusieurs décors redessinés
   [ AJOUT ]  Plante Piranha redessinée


 ==============================================================================
   [ 02 ]   P H Y S I Q U E   E T   C O N T R Ô L E S
 ==============================================================================

   [ MODIF ]  Vitesse de sprint +10 %
   [ MODIF ]  Inertie réduite : moins de patinage, vitesse atteinte plus vite
   [ AJOUT ]  Contrôle aérien amélioré
   [ AJOUT ]  Se retourner en plein saut


 ==============================================================================
   [ 03 ]   G A M E P L A Y
 ==============================================================================

   [ AJOUT ]  Capacité de porter les carapaces
   [ AJOUT ]  Rebond variable sur les ennemis (maintenir A pour monter plus)
   [ AJOUT ]  Appuyer sur A trop tôt ne fait plus rater le saut : il part
              dès que Mario touche le sol
   [ MODIF ]  Mario feu touché redevient grand au lieu de petit
   [ AJOUT ]  Une vie au 7e ennemi tué à la carapace
   [ AJOUT ]  Une vie au 10e ennemi sous étoile, puis à chaque suivant
   [ AJOUT ]  Code Konami : saut de niveau au bouton Select
              Haut Haut Bas Bas Gauche Droite Gauche Droite B A


 ==============================================================================
   [ 04 ]   N I V E A U X   E T   D É C O R S
 ==============================================================================

   [ AJOUT ]  Niveaux de neige, en version jour et nuit
   [ AJOUT ]  Ciel étoilé animé dans les niveaux de nuit et souterrains
   [ MODIF ]  Quelques décors modifiés
   [ MODIF ]  1-3 a ses propres données de niveau (partagées avec 5-3 avant)


 ==============================================================================
   [ 05 ]   M E N U   E T   M O D E S
 ==============================================================================

   [ AJOUT ]  Luigi jouable seul, sans passer par le mode deux joueurs
   [ MODIF ]  Menu piloté à la croix, avec curseur et sons
   [ AJOUT ]  Luigi affiché sur l'écran-titre en mode deux frères
   [ AJOUT ]  Menu CONTINUE / END à la fin de partie
   [ AJOUT ]  Deux écrans de crédits au démarrage


 ==============================================================================
   [ 06 ]   S O N   E T   M U S I Q U E
 ==============================================================================

   [ MODIF ]  Musiques modifiées sur l'ensemble du jeu
   [ MODIF ]  Instruments et sonorités remplacés
   [ AJOUT ]  Vraie batterie échantillonnée (DPCM) : grosse caisse et claire
   [ AJOUT ]  Vibrato sur les notes tenues
   [ AJOUT ]  Écho de caverne dans les niveaux souterrains
   [ AJOUT ]  Sons sur le menu-titre


 ==============================================================================
   [ 07 ]   S O U S   L E   C A P O T
 ==============================================================================

   [ MODIF ]  Passage au mapper MMC3 : deux fois plus de place pour le code,
              et des graphismes commutables. Tout le reste en dépendait.
   [ MODIF ]  La coupure du tableau de bord est faite par le mapper au lieu
              d'une boucle d'attente : plus de clignotement, et du temps rendu
   [ AJOUT ]  Les graphismes s'éditent en PNG et sont réinjectés au build


 ==============================================================================
   [ 08 ]   C R É D I T S
 ==============================================================================

     SOLVALOU ART . . . . . . . . . . . . . .  Sprites de personnages
     KUATO . . . . . . . . . . . . . . . . .   Gameplay, recoloration,
                                               graphismes additionnels,
                                               modifications musicales,
                                               Plante Piranha

     Super Mario Bros. est une propriété de Nintendo.
     Ce hack est un travail d'amateur, gratuit et non officiel.


 ==============================================================================
                        E N D   O F   F I L E   /   F I N
 ==============================================================================
