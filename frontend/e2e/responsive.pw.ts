import { expect, test as base, type Locator, type Page, type TestInfo } from '@playwright/test';

const test = base.extend({
  page: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    // Ces tests isolent l'interface : ils ne prouvent pas l'intégration avec Django.
    await page.route('**/api/v1/health', (route) => route.fulfill({ json: { status: 'ok' } }));
    await use(page);
    expect(errors, 'Aucune erreur JavaScript pendant le parcours').toEqual([]);
  },
});

const routes = [
  '/',
  '/agent',
  '/agent/equipements',
  '/agent/equipements/EQ-OUT-0003',
  '/agent/equipements/inconnu',
  '/agent/incidents',
  '/agent/incidents/nouveau/EQ-OUT-0003',
  '/agent/incidents/nouveau/inconnu',
  '/agent/scanner',
  '/agent/profil',
  '/responsable',
  '/responsable/equipements',
  '/responsable/equipements/EQ-OUT-0003',
  '/responsable/equipements/inconnu',
  '/responsable/incidents',
  '/responsable/incidents/nouveau/EQ-OUT-0003',
  '/responsable/incidents/nouveau/inconnu',
  '/responsable/interventions',
  '/responsable/agents',
];

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  // Un pixel de tolérance absorbe les arrondis de mise en page, pas un élément tronqué.
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) -
            document.documentElement.clientWidth,
        ),
      { message: 'Le document tient dans la largeur de la fenêtre' },
    )
    .toBeLessThanOrEqual(1);
}

async function capture(page: Page, info: TestInfo, name: string): Promise<void> {
  await info.attach(name, {
    body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
    contentType: 'image/png',
  });
}

async function expectSingleLineLabel(control: Locator): Promise<void> {
  await expect(control).toBeInViewport({ ratio: 1 });
  const fits = await control.evaluate((element) => {
    const label = element.querySelector('span:last-child');
    if (!label) return false;
    const range = document.createRange();
    range.selectNodeContents(label);
    const text = range.getBoundingClientRect();
    const bounds = element.getBoundingClientRect();
    const lines = new Set(Array.from(range.getClientRects(), (rect) => Math.round(rect.top)));
    return lines.size === 1 && text.left >= bounds.left - 1 && text.right <= bounds.right + 1;
  });
  expect(fits, 'Le libellé tient sur une ligne dans son bouton').toBe(true);
}

async function expectFocusedControlVisible(
  page: Page,
  control: Locator,
  space: string,
): Promise<void> {
  await expect(control).toBeFocused();
  await expect(control).toBeInViewport({ ratio: 1 });
  if (space === 'agent') {
    await expect
      .poll(
        async () => {
          const bounds = (await control.boundingBox())!;
          const navigation = (await page.locator('nav').boundingBox())!;
          return bounds.y + bounds.height <= navigation.y;
        },
        { message: 'Le contrôle focalisé reste au-dessus de la navigation fixe' },
      )
      .toBe(true);
  }
}

async function expectIncidentsActive(page: Page, space: string): Promise<void> {
  await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute(
    'href',
    `/${space}/incidents`,
  );
  if (space === 'agent' && page.viewportSize()!.width <= 760) {
    const plus = page.getByRole('button', { name: 'Plus — Incidents actif', exact: true });
    await expect(plus).toBeVisible();
    await expect(plus).toHaveClass(/active/);
  }
}

async function expectEvenAgentNavigation(navigation: Locator): Promise<void> {
  const links = await navigation.getByRole('link').evaluateAll((elements) =>
    elements.map((element) => {
      const { left, right, width } = element.getBoundingClientRect();
      return { left, right, width };
    }),
  );
  const content = await navigation.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      left: bounds.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft),
      right: bounds.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight),
    };
  });
  expect(links.length).toBeGreaterThan(0);
  expect(links[0].left).toBeCloseTo(content.left, 0);
  expect(links[links.length - 1].right).toBeCloseTo(content.right, 0);
  for (let index = 1; index < links.length; index++) {
    expect(links[index].width).toBeCloseTo(links[0].width, 0);
    expect(links[index].left).toBeCloseTo(links[index - 1].right, 0);
  }
}

for (const path of routes) {
  test(`La page ${path} tient dans la fenêtre`, async ({ page }, info) => {
    await page.goto(path);
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
    if (path === '/') await expect(page.getByRole('status')).toContainText('API disponible');
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'page');
  });
}

for (const space of ['agent', 'responsable']) {
  test(`La déclaration de ${space} valide au clavier, permet de modifier et termine sans enregistrement`, async ({
    page,
  }, info) => {
    const query = '  tONDeUSE  ';
    const material = `/${space}/equipements`;
    const detail = `${material}/EQ-OUT-0001`;
    const declaration = `/${space}/incidents/nouveau/EQ-OUT-0001`;
    const main = page.getByRole('main');
    const title = main.getByRole('textbox', { name: 'Intitulé', exact: true });
    const description = main.getByRole('textbox', { name: 'Description', exact: true });
    const verify = main.getByRole('button', { name: 'Vérifier la déclaration', exact: true });
    const risk = main.getByRole('checkbox', {
      name: "Je signale un risque ou une impossibilité d'utilisation",
      exact: true,
    });
    const businessRequests: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.startsWith('/api/')) businessRequests.push(request.url());
    });
    await page.goto(`${detail}?${new URLSearchParams({ q: query })}`);
    await expect(main).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(main.getByRole('link', { name: 'Retour au matériel', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    const open = main.getByRole('link', { name: 'Déclarer un incident', exact: true });
    await expectFocusedControlVisible(page, open, space);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(
      (url) => url.pathname === declaration && url.searchParams.get('q') === query,
    );
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Déclarer un incident');
    await expect(main.getByText('Données de démonstration', { exact: true })).toBeVisible();
    await expect(main.locator('.demo-notice')).toContainText("n'enregistre et n'envoie rien");
    await expect(main.locator('.equipment-summary')).toContainText('Tondeuse autoportée');
    await expect(main.locator('.equipment-summary')).toContainText(
      'EQ-OUT-0001 · Centre technique municipal',
    );
    await expectIncidentsActive(page, space);
    await expect(main).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      main.getByRole('link', { name: 'Retour à la fiche matériel', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expectFocusedControlVisible(page, title, space);
    await page.keyboard.type('Le moteur cale');
    await page.keyboard.press('Tab');
    await expectFocusedControlVisible(page, description, space);
    await page.keyboard.type('   ');
    await verify.focus();
    await page.keyboard.press('Enter');
    await expectFocusedControlVisible(page, description, space);
    await expect(description).toHaveAttribute('aria-invalid', 'true');
    await expect(description).toHaveAttribute(
      'aria-describedby',
      'description-help description-error',
    );
    await expect(main.locator('#description-error')).toContainText('caractère autre');
    await expect(title).toHaveValue('Le moteur cale');
    await expect(description).toHaveValue('   ');
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'incident-erreurs');
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('Le moteur cale lors de l’accélération.\nRedémarrage difficile.');
    await verify.focus();
    await page.keyboard.press('Enter');
    const low = main.getByRole('radio', { name: 'Faible — intervention à planifier', exact: true });
    await expectFocusedControlVisible(page, low, space);
    await expect(main.locator('#priority-error')).toContainText('Choisissez une priorité');
    await expect(main.getByRole('radio', { checked: true })).toHaveCount(0);
    await page.keyboard.press('ArrowDown');
    const high = main.getByRole('radio', { name: 'Haute — intervention rapide', exact: true });
    await expect(high).toBeChecked();
    await expectFocusedControlVisible(page, high, space);
    await page.keyboard.press('Tab');
    await expectFocusedControlVisible(page, risk, space);
    await page.keyboard.press('Space');
    await expect(risk).toBeChecked();
    await page.keyboard.press('Tab');
    await expectFocusedControlVisible(page, verify, space);
    await capture(page, info, 'incident-formulaire');
    await page.keyboard.press('Enter');
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Vérifier la déclaration');
    await expect(main.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(main.locator('dd')).toHaveText([
      'Le moteur cale',
      'Le moteur cale lors de l’accélération.\nRedémarrage difficile.',
      'Haute — intervention rapide',
      'Oui',
    ]);
    await expectIncidentsActive(page, space);
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'incident-recapitulatif');
    await page.keyboard.press('Tab');
    await expect(
      main.getByRole('button', { name: 'Terminer la simulation', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    const edit = main.getByRole('button', { name: 'Modifier', exact: true });
    await expectFocusedControlVisible(page, edit, space);
    await page.keyboard.press('Enter');
    await expectFocusedControlVisible(page, title, space);
    await expect(description).toHaveValue(
      'Le moteur cale lors de l’accélération.\nRedémarrage difficile.',
    );
    await expect(high).toBeChecked();
    await expect(risk).toBeChecked();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('Le moteur cale à chaud');
    await verify.focus();
    await page.keyboard.press('Enter');
    await expect(main.locator('dd').first()).toHaveText('Le moteur cale à chaud');
    await page.keyboard.press('Tab');
    const finish = main.getByRole('button', { name: 'Terminer la simulation', exact: true });
    await expectFocusedControlVisible(page, finish, space);
    await page.keyboard.press('Enter');
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Simulation terminée');
    await expect(main).toContainText("Aucun incident n'a été enregistré ni envoyé");
    await expectIncidentsActive(page, space);
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'incident-simulation-terminee');
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === declaration &&
        url.searchParams.get('q') === query &&
        [...url.searchParams.keys()].join() === 'q',
    );
    expect(businessRequests, 'Aucune requête métier pour cette simulation').toEqual([]);
    expect(
      await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } })),
    ).toEqual({ local: {}, session: {} });
    await page.keyboard.press('Tab');
    const back = main.getByRole('link', { name: 'Retour à la fiche', exact: true });
    await expectFocusedControlVisible(page, back, space);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(
      (url) => url.pathname === detail && url.searchParams.get('q') === query,
    );
    await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute('href', material);
    await main.getByRole('link', { name: 'Retour au matériel', exact: true }).click();
    await expect(main.getByRole('searchbox')).toHaveValue(query);
    await expect(main.getByRole('listitem')).toHaveCount(1);
    await expectNoHorizontalOverflow(page);
  });

  test(`La déclaration de ${space} fonctionne en accès direct, s'annule et perd sa saisie au rechargement`, async ({
    page,
  }, info) => {
    const path = `/${space}/incidents/nouveau/EQ-OUT-0003`;
    const query = '  OUT  ';
    const main = page.getByRole('main');
    await page.goto(`${path}?${new URLSearchParams({ q: query })}`);
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Déclarer un incident');
    await expectIncidentsActive(page, space);
    const title = main.getByRole('textbox', { name: 'Intitulé', exact: true });
    const description = main.getByRole('textbox', { name: 'Description', exact: true });
    await main.getByRole('button', { name: 'Vérifier la déclaration', exact: true }).click();
    await expectFocusedControlVisible(page, title, space);
    await expect(main.locator('.error')).toHaveCount(3);
    await title.fill('B'.repeat(120));
    await description.fill('D'.repeat(2000));
    await main.getByRole('radio', { name: 'Urgente — danger immédiat', exact: true }).check();
    await main.getByRole('checkbox').check();
    await main.getByRole('button', { name: 'Vérifier la déclaration', exact: true }).click();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Vérifier la déclaration');
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'incident-recapitulatif-limites');
    await page.reload();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Déclarer un incident');
    await expect(title).toHaveValue('');
    await expect(description).toHaveValue('');
    await expect(main.getByRole('radio', { checked: true })).toHaveCount(0);
    await expect(main.getByRole('checkbox')).not.toBeChecked();
    await expect(main.locator('.error')).toHaveCount(0);
    await main.getByRole('link', { name: 'Annuler', exact: true }).click();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === `/${space}/equipements/EQ-OUT-0003` && url.searchParams.get('q') === query,
    );
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Débroussailleuse n°3');
    await main.getByRole('link', { name: 'Déclarer un incident', exact: true }).click();
    await expect(title).toHaveValue('');
    await main.getByRole('link', { name: 'Retour à la fiche matériel', exact: true }).click();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === `/${space}/equipements/EQ-OUT-0003` && url.searchParams.get('q') === query,
    );
    await page.goto(`/${space}/incidents/nouveau/inconnu?${new URLSearchParams({ q: query })}`);
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Équipement introuvable');
    await expect(main.locator('form')).toHaveCount(0);
    await expectIncidentsActive(page, space);
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'incident-materiel-introuvable');
    await main.getByRole('link', { name: 'Retour au matériel', exact: true }).click();
    await expect(main.getByRole('searchbox')).toHaveValue(query);
    await expect(main.getByRole('listitem')).toHaveCount(4);
  });

  test(`La recherche Matériel fonctionne au clavier dans l’espace ${space}`, async ({
    page,
  }, info) => {
    await page.goto(`/${space}/equipements`);
    const main = page.getByRole('main');
    const input = main.getByRole('searchbox', { name: 'Rechercher par nom ou identifiant' });
    const items = main.getByRole('list', { name: 'Équipements' }).getByRole('listitem');
    const clear = main.getByRole('button', { name: 'Effacer la recherche' });

    await expect(main.getByText('Données de démonstration', { exact: true })).toBeVisible();
    await expect(items).toHaveCount(6);
    await input.focus();
    await page.keyboard.type('  tONDeUSE  ');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Tondeuse autoportée');
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'recherche-nom');

    await input.fill('  eq-veh-0042  ');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Fourgon de voirie');
    await input.fill('   ');
    await expect(items).toHaveCount(6);

    await input.fill('Équipement introuvable '.repeat(15));
    await expect(items).toHaveCount(0);
    await expect(main.getByRole('status')).toContainText('Aucun équipement ne correspond');
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'recherche-sans-resultat');
    await page.keyboard.press('Tab');
    await expect(clear).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('');
    await expect(items).toHaveCount(6);
    await expect(page).toHaveURL(new RegExp(`/${space}/equipements$`));
    await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute(
      'href',
      `/${space}/equipements`,
    );
    await expectNoHorizontalOverflow(page);
  });

  test(`La fiche Matériel conserve la recherche et le clavier dans l’espace ${space}`, async ({
    page,
  }, info) => {
    const base = `/${space}/equipements`;
    const query = '  tONDeUSE  ';
    await page.goto(base);
    const main = page.getByRole('main');
    const input = main.getByRole('searchbox', { name: 'Rechercher par nom ou identifiant' });
    await input.focus();
    await page.keyboard.type(query);
    await expect(main.getByRole('listitem')).toHaveCount(1);
    await expect(page).toHaveURL(
      (url) => url.pathname === base && url.searchParams.get('q') === query,
    );
    const equipment = main.getByRole('link', { name: 'Tondeuse autoportée', exact: true });
    const detailUrl = new URL((await equipment.getAttribute('href'))!, page.url());
    expect(detailUrl.pathname).toBe(`${base}/EQ-OUT-0001`);
    expect(detailUrl.searchParams.get('q')).toBe(query);

    await page.keyboard.press('Tab');
    await expect(main.getByRole('button', { name: 'Effacer la recherche' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(equipment).toBeFocused();
    await expect(equipment).toBeInViewport({ ratio: 1 });
    if (space === 'agent') {
      const linkBounds = (await equipment.boundingBox())!;
      const navigationBounds = (await page.locator('nav').boundingBox())!;
      expect(
        linkBounds.y + linkBounds.height,
        'Le lien focalisé reste au-dessus de la barre basse',
      ).toBeLessThanOrEqual(navigationBounds.y);
    }
    await capture(page, info, 'lien-fiche-focus');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(
      (url) => url.pathname === `${base}/EQ-OUT-0001` && url.searchParams.get('q') === query,
    );
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Tondeuse autoportée');
    await expect(main.getByText('Données de démonstration', { exact: true })).toBeVisible();
    await expect(main.getByText('EQ-OUT-0001', { exact: true })).toBeVisible();
    await expect(main.getByText('Centre technique municipal', { exact: true })).toBeVisible();
    await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute('href', base);
    await expect(page.locator('nav')).toHaveAttribute(
      'aria-label',
      space === 'agent' ? 'Navigation Agent' : 'Navigation Responsable',
    );
    await expect(main).toBeFocused();
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'fiche-materiel');

    await page.keyboard.press('Tab');
    await expect(main.getByRole('link', { name: 'Retour au matériel', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(
      (url) => url.pathname === base && url.searchParams.get('q') === query,
    );
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Matériel');
    await expect(input).toHaveValue(query);
    await expect(main.getByRole('listitem')).toHaveCount(1);
    await expect(equipment).toBeVisible();
    await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute('href', base);
    await expect(main).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(input).toBeFocused();
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'retour-recherche');
  });

  test(`La fiche Matériel de ${space} fonctionne en accès direct, après rechargement et avec un id inconnu`, async ({
    page,
  }, info) => {
    const base = `/${space}/equipements`;
    const main = page.getByRole('main');
    await page.goto(`${base}/EQ-OUT-0003`);
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Débroussailleuse n°3');
    await expect(main.getByText('Atelier municipal', { exact: true })).toBeVisible();
    const back = main.getByRole('link', { name: 'Retour au matériel', exact: true });
    await expect(back).toHaveAttribute('href', base);
    await page.reload();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Débroussailleuse n°3');
    await expect(main.getByText('EQ-OUT-0003', { exact: true })).toBeVisible();
    await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute('href', base);
    await expectNoHorizontalOverflow(page);
    await back.click();
    await expect(page).toHaveURL(new RegExp(`${base}$`));
    await expect(main.getByRole('listitem')).toHaveCount(6);

    await page.goto(`${base}/EQ-VEH-0042`);
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Fourgon de voirie');
    await expect(main).not.toContainText('Débroussailleuse');
    await expect(main.getByText('Garage municipal', { exact: true })).toBeVisible();

    const query = '  eq-veh-0042  ';
    await page.goto(`${base}/inconnu?${new URLSearchParams({ q: query })}`);
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Équipement introuvable');
    await expect(main).not.toContainText('Fourgon de voirie');
    await expect(main.getByText('Données de démonstration', { exact: true })).toBeVisible();
    await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute('href', base);
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'equipement-introuvable');
    await back.click();
    await expect(page).toHaveURL(
      (url) => url.pathname === base && url.searchParams.get('q') === query,
    );
    const input = main.getByRole('searchbox', { name: 'Rechercher par nom ou identifiant' });
    await expect(input).toHaveValue(query);
    await expect(main.getByRole('listitem')).toHaveCount(1);
    await expect(main.getByRole('link', { name: 'Fourgon de voirie', exact: true })).toBeVisible();
    await page.reload();
    await expect(input).toHaveValue(query);
    await expect(main.getByRole('listitem')).toHaveCount(1);
    await expectNoHorizontalOverflow(page);
  });
}

test('La navigation Agent conserve ses destinations selon la taille', async ({ page }, info) => {
  await page.goto('/agent');
  const navigation = page.getByRole('navigation', { name: 'Navigation Agent' });
  const plus = navigation.getByRole('button', { name: /^Plus/ });
  const incidents = navigation.getByRole('link', { name: 'Incidents', exact: true });
  const profile = navigation.getByRole('link', { name: 'Profil', exact: true });

  if ((page.viewportSize()?.width ?? 0) > 760) {
    await expect(plus).toBeHidden();
    const names = ['Accueil', 'Matériel', 'Incidents', 'Profil'];
    if ((page.viewportSize()?.width ?? 0) < 1200) names.splice(2, 0, 'Scanner');
    await expect(navigation.getByRole('link')).toHaveText(names);
    await expect(incidents).toBeVisible();
    await expect(profile).toBeVisible();
    await expectEvenAgentNavigation(navigation);
    await expectNoHorizontalOverflow(page);
    return;
  }

  await expect(incidents).toBeHidden();
  await expect(profile).toBeHidden();
  for (const name of ['Accueil', 'Matériel', 'Scanner']) {
    await expectSingleLineLabel(navigation.getByRole('link', { name, exact: true }));
  }
  await expectSingleLineLabel(plus);

  // Le toucher reproduit le blur qui avait masqué les liens avant leur activation.
  await plus.tap();
  await expect(plus).toHaveAttribute('aria-expanded', 'true');
  await expect(incidents).toBeInViewport({ ratio: 1 });
  await expect(profile).toBeInViewport({ ratio: 1 });
  await expectNoHorizontalOverflow(page);
  await capture(page, info, 'menu-plus-ouvert');

  await page.keyboard.press('Escape');
  await expect(plus).toHaveAttribute('aria-expanded', 'false');
  await expect(plus).toBeFocused();

  await plus.tap();
  await incidents.tap();
  await expect(page).toHaveURL(/\/agent\/incidents$/);
  await expect(plus).toHaveAccessibleName('Plus — Incidents actif');
  await expect(plus).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('main')).toBeFocused();

  await plus.tap();
  await profile.tap();
  await expect(page).toHaveURL(/\/agent\/profil$/);
  await expect(plus).toHaveAccessibleName('Plus — Profil actif');

  await plus.tap();
  await navigation.getByRole('button', { name: 'Fermer', exact: true }).tap();
  await expect(plus).toHaveAttribute('aria-expanded', 'false');
  await expect(plus).toBeFocused();

  await plus.tap();
  await page.getByRole('main').getByRole('heading', { level: 1 }).tap();
  await expect(plus).toHaveAttribute('aria-expanded', 'false');
  await expectNoHorizontalOverflow(page);
});

test('Les accès Scanner suivent la présentation et la route reste accessible', async ({
  page,
}, info) => {
  await page.goto('/agent');
  const main = page.getByRole('main');
  const shortcut = main.getByRole('link', { name: 'Scanner un QR code', exact: true });
  const navigation = page.getByRole('navigation', { name: 'Navigation Agent' });
  const scanner = navigation.getByRole('link', { name: 'Scanner', exact: true });
  const scannerVisible = (page.viewportSize()?.width ?? 0) < 1200;

  await expect(shortcut).toBeVisible({ visible: scannerVisible });
  await expect(scanner).toBeVisible({ visible: scannerVisible });
  // Le masquage du li doit aussi retirer sa puce et son espace dans la liste.
  await expect(main.getByRole('listitem')).toHaveCount(scannerVisible ? 3 : 2);
  await capture(page, info, 'acces-scanner');

  await main.focus();
  await page.keyboard.press('Tab');
  await expect(main.getByRole('link', { name: 'Matériel', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(main.getByRole('link', { name: 'Incidents', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  if (scannerVisible) {
    await expect(shortcut).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/agent\/scanner$/);
    await page.goto('/agent');
    await scanner.click();
    await expect(page).toHaveURL(/\/agent\/scanner$/);
  } else {
    // Le lien masqué reste dans le DOM, mais getByRole ne l'expose plus.
    await expect(main.locator('a[href="/agent/scanner"]')).not.toBeFocused();
  }

  await page.goto('/agent/scanner');
  await expect(page).toHaveURL(/\/agent\/scanner$/);
  await expect(main.getByRole('heading', { name: 'Scanner', exact: true })).toBeVisible();
  await expect(main).toContainText('prochain incrément');
  // Matériel reste le premier accès après Accueil ; Tab ignore Scanner sur grand écran.
  await navigation.getByRole('link', { name: 'Accueil', exact: true }).focus();
  await page.keyboard.press('Tab');
  const equipment = navigation.getByRole('link', { name: 'Matériel', exact: true });
  await expect(equipment).toBeFocused();
  if ((page.viewportSize()?.width ?? 0) > 760) {
    await page.keyboard.press('Tab');
    await expect(
      navigation.getByRole('link', { name: scannerVisible ? 'Scanner' : 'Incidents', exact: true }),
    ).toBeFocused();
    await equipment.focus();
  }
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/agent\/equipements$/);
  await expect(
    main.getByRole('searchbox', { name: 'Rechercher par nom ou identifiant' }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('Redimensionner conserve les accès Scanner sous 1200 px et répartit la navigation', async ({
  page,
}, info) => {
  await page.goto('/agent');
  const main = page.getByRole('main');
  const navigation = page.getByRole('navigation', { name: 'Navigation Agent' });
  const shortcut = main.getByRole('link', { name: 'Scanner un QR code', exact: true });
  const scanner = navigation.getByRole('link', { name: 'Scanner', exact: true });

  // Les allers-retours sans rechargement couvrent les limites et la tablette en paysage.
  for (const width of [1024, 1199, 1200, 1201, 1440, 1200, 1199, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1024 });
    const scannerVisible = width < 1200;
    await expect(shortcut).toBeVisible({ visible: scannerVisible });
    await expect(scanner).toBeVisible({ visible: scannerVisible });
    await expect(main.getByRole('listitem')).toHaveCount(scannerVisible ? 3 : 2);
    if (width > 760) {
      const names = ['Accueil', 'Matériel', 'Incidents', 'Profil'];
      if (scannerVisible) names.splice(2, 0, 'Scanner');
      await expect(navigation.getByRole('link')).toHaveText(names);
      await expectEvenAgentNavigation(navigation);
    } else {
      await expect(navigation.getByRole('link')).toHaveText(['Accueil', 'Matériel', 'Scanner']);
      await expect(navigation.getByRole('button', { name: 'Plus', exact: true })).toBeVisible();
    }
    await expectNoHorizontalOverflow(page);
    if ([1024, 1199, 1200, 1201].includes(width)) await capture(page, info, `seuil-${width}`);
  }
});

test('La navigation Responsable garde le contexte après un changement de page', async ({
  page,
}, info) => {
  await page.goto('/responsable');
  const navigation = page.getByRole('navigation', { name: 'Navigation Responsable' });
  const toggle = page.getByRole('button', { name: /la navigation/ });
  const mobile = (page.viewportSize()?.width ?? 0) <= 760;

  if (mobile) {
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(navigation).toBeHidden();
    await toggle.tap();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  } else {
    await expect(toggle).toBeHidden();
  }
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole('link')).toHaveCount(5);
  await expectNoHorizontalOverflow(page);
  await capture(page, info, 'navigation-responsable');
  await navigation.getByRole('link', { name: 'Matériel', exact: true }).click();
  await expect(page).toHaveURL(/\/responsable\/equipements$/);
  await expect(page.getByRole('main').getByRole('heading', { name: 'Matériel' })).toBeVisible();
  if (mobile) {
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(navigation).toBeHidden();
    await expect(page.getByRole('main')).toBeFocused();
  }
  await expectNoHorizontalOverflow(page);
});

test('Le lien d’évitement donne accès au contenu au clavier', async ({ page }) => {
  await page.goto('/agent');
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Aller au contenu' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});
