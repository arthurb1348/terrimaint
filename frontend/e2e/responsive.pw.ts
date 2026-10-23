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
  '/agent/incidents',
  '/agent/scanner',
  '/agent/profil',
  '/responsable',
  '/responsable/equipements',
  '/responsable/incidents',
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

for (const path of routes) {
  test(`La page ${path} tient dans la fenêtre`, async ({ page }, info) => {
    await page.goto(path);
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
    if (path === '/') await expect(page.getByRole('status')).toContainText('API disponible');
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'page');
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
    await expect(navigation.getByRole('link')).toHaveCount(5);
    await expect(incidents).toBeVisible();
    await expect(profile).toBeVisible();
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
