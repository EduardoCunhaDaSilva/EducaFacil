/* ============================
   Educa Fácil EAD - Interatividade
   ============================ */
(() => {
    'use strict';

    /* ---------- Mobile nav toggle ---------- */
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');

    if (navToggle && nav) {
        navToggle.addEventListener('click', () => {
            const isOpen = nav.classList.toggle('is-open');
            navToggle.setAttribute('aria-expanded', String(isOpen));
        });

        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('is-open');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    /* ---------- Smooth scroll with header offset ---------- */
    const header = document.querySelector('.header');
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#' || targetId.length < 2) return;
            const target = document.querySelector(targetId);
            if (!target) return;
            e.preventDefault();
            const offset = header ? header.offsetHeight : 0;
            const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });

    /* ---------- FAQ: only one item open at a time ---------- */
    const faqItems = document.querySelectorAll('.faq__item');
    faqItems.forEach(item => {
        item.addEventListener('toggle', () => {
            if (item.open) {
                faqItems.forEach(other => {
                    if (other !== item) other.open = false;
                });
            }
        });
    });

    /* ---------- Reveal on scroll ---------- */
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        document.querySelectorAll('.card, .phone, .courses__list li, .faq__item')
            .forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(el);
            });

        const style = document.createElement('style');
        style.textContent = `.is-visible { opacity: 1 !important; transform: translateY(0) !important; }`;
        document.head.appendChild(style);
    }

    /* ---------- Image carousel ---------- */
    const carousel = document.querySelector('.carousel');
    if (carousel) {
        const slides = carousel.querySelectorAll('.carousel__slide');
        const dots   = carousel.querySelectorAll('.carousel__dot');
        const prevBtn = carousel.querySelector('.carousel__arrow--left');
        const nextBtn = carousel.querySelector('.carousel__arrow--right');
        const interval = parseInt(carousel.dataset.autoplay, 10) || 5000;

        let current = 0;
        let timer = null;

        const goTo = (index) => {
            current = (index + slides.length) % slides.length;
            slides.forEach((s, i) => s.classList.toggle('is-active', i === current));
            dots.forEach((d, i)   => d.classList.toggle('is-active', i === current));
        };

        const next  = () => goTo(current + 1);
        const prev  = () => goTo(current - 1);

        const start = () => {
            stop();
            timer = setInterval(next, interval);
        };
        const stop = () => {
            if (timer) { clearInterval(timer); timer = null; }
        };
        const restart = () => { stop(); start(); };

        nextBtn?.addEventListener('click', () => { next(); restart(); });
        prevBtn?.addEventListener('click', () => { prev(); restart(); });

        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => { goTo(i); restart(); });
        });

        carousel.addEventListener('mouseenter', stop);
        carousel.addEventListener('mouseleave', start);

        document.addEventListener('visibilitychange', () => {
            document.hidden ? stop() : start();
        });

        // Touch / swipe support
        let touchStartX = 0;
        carousel.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        carousel.addEventListener('touchend', e => {
            const diff = e.changedTouches[0].screenX - touchStartX;
            if (Math.abs(diff) > 50) {
                diff > 0 ? prev() : next();
                restart();
            }
        });

        start();
    }

    /* ---------- Course search (cursos.html) ---------- */
    const searchInput = document.querySelector('#course-search');
    if (searchInput) {
        const courseCards = document.querySelectorAll('.course-card');
        const searchClear = document.querySelector('.search-box__clear');
        const searchCount = document.querySelector('.search-box__count');
        const noResults = document.querySelector('.courses-no-results');
        const courseGrid = document.querySelector('.course-grid');

        const MAX_QUERY_LEN = 80;

        // Palavras-chave alternativas por curso: abreviações, sinônimos,
        // grafias comuns sem acento, termos correlatos.
        const COURSE_ALIASES = {
            'Administração': ['adm', 'admin', 'administracao', 'gestao'],
            'Informática': ['ti', 'computacao', 'computador', 'pc', 'tecnologia da informacao', 'informatica'],
            'Saúde': ['saude', 'area saude', 'medicina'],
            'Logística': ['logistica', 'estoque', 'almoxarifado', 'transporte', 'supply chain', 'expedicao'],
            'Marketing Digital': ['mkt', 'marketing', 'midias sociais', 'redes sociais', 'instagram', 'facebook', 'ads', 'anuncios', 'digital marketing', 'social media'],
            'Recursos Humanos': ['rh', 'gestao de pessoas', 'departamento pessoal', 'dp', 'recrutamento'],
            'Agente Comunitário de Saúde': ['acs', 'agente saude', 'agente comunitario', 'sus'],
            'Agrimensura': ['topografia', 'topografo', 'mapas', 'georreferenciamento'],
            'Agricultura': ['agro', 'lavoura', 'plantacao', 'cultivo'],
            'Agroindústria': ['agro', 'agroindustria', 'industria alimenticia', 'beneficiamento'],
            'Agropecuária': ['agro', 'fazenda', 'gado', 'pecuaria', 'rural'],
            'Análises Clínicas': ['laboratorio', 'lab', 'analises', 'hemograma', 'exames', 'patologia'],
            'Automação Industrial': ['automacao', 'robotica', 'plc', 'clp', 'controle processos'],
            'Biotecnologia': ['biotec', 'dna', 'genetica', 'biologia molecular'],
            'Contabilidade': ['contabil', 'contador', 'contadora', 'financas', 'fiscal', 'balanco', 'imposto'],
            'Cuidados de Idosos': ['cuidador', 'idoso', 'geriatria', 'enfermagem idosos', 'home care'],
            'Defesa Civil': ['emergencia', 'salvamento', 'desastres', 'protecao civil'],
            'Design Gráfico': ['designer grafico', 'photoshop', 'illustrator', 'arte digital', 'diagramacao', 'design'],
            'Designer de Interiores': ['decoracao', 'ambientes', 'design interiores', 'arquitetura interiores', 'decorador'],
            'Desenvolvimento de Sistemas': ['programacao', 'programador', 'dev', 'developer', 'software', 'ds', 'codigo', 'sistemas', 'java', 'python', 'app', 'aplicativo'],
            'Edificações': ['construcao civil', 'obras', 'engenharia civil', 'pedreiro', 'mestre obras', 'construcao'],
            'Eletromecânica': ['mecatronica', 'eletromec', 'eletro mecanica'],
            'Eletrotécnica': ['eletricista', 'eletrica', 'eletro', 'instalacao eletrica'],
            'Eletrônica': ['eletronica', 'circuitos', 'placa', 'microchip', 'reparo eletronico'],
            'Enfermagem': ['enfermeira', 'enfermeiro', 'tec enfermagem', 'auxiliar enfermagem', 'hospital'],
            'Equipamentos Biomédicos': ['biomedico', 'biomedicina', 'equipamentos hospitalares', 'engenharia clinica'],
            'Estética': ['esteticista', 'beleza', 'spa', 'cuidados pele', 'estetica facial', 'estetica corporal'],
            'Eventos': ['producao eventos', 'festas', 'cerimonial', 'organizador', 'casamento'],
            'Farmácia': ['farmaceutico', 'farmaceutica', 'balconista farmacia', 'atendente farmacia', 'remedio', 'drogaria'],
            'Gastronomia': ['culinaria', 'chef', 'cozinha', 'cozinheiro', 'cozinheira', 'gastro', 'comida'],
            'Gerência em Saúde': ['gestao saude', 'gestor hospital', 'administracao hospitalar', 'gestao hospitalar'],
            'Guia de Turismo': ['turismo', 'guia', 'viagem', 'turistico', 'guia turistico', 'viagens'],
            'Informática para Internet': ['web', 'internet', 'html', 'css', 'javascript', 'webdesign', 'web designer', 'frontend', 'front-end', 'site', 'desenvolvimento web', 'wordpress'],
            'Manutenção de Máquinas Industriais': ['manutencao industrial', 'industrial', 'mecanico industrial', 'mantenedor'],
            'Manutenção de Máquinas Navais': ['navio', 'naval', 'marinha', 'embarcacao', 'motor barco', 'mecanico naval', 'maritimo'],
            'Máquinas Pesadas': ['trator', 'escavadeira', 'retroescavadeira', 'operador maquinas', 'caminhao', 'carregadeira', 'rolo compactador'],
            'Mecânica': ['mecanico', 'motor', 'motores', 'automotiva', 'carro', 'oficina', 'reparo veiculos'],
            'Meio Ambiente': ['ambiental', 'ecologia', 'sustentabilidade', 'natureza', 'reciclagem', 'ecologico', 'verde'],
            'Metalurgia': ['metal', 'metais', 'aco', 'siderurgia', 'fundicao'],
            'Mineração': ['minerador', 'mina', 'minas', 'geologia', 'extracao mineral'],
            'Nutrição e Dietética': ['nutricionista', 'nutricao', 'dieta', 'alimentacao', 'reeducacao alimentar', 'nutri'],
            'Óptica': ['optico', 'oculos', 'oticista', 'otica', 'lentes', 'visao'],
            'Prevenção e Combate ao Incêndio': ['bombeiro', 'incendio', 'fogo', 'brigadista', 'brigada', 'combate fogo'],
            'Qualidade': ['controle qualidade', 'iso', 'auditoria', 'cq', 'inspecao'],
            'Química': ['quimico', 'laboratorio quimico', 'industria quimica', 'reacoes'],
            'Radiologia': ['raio x', 'raio-x', 'rx', 'radio', 'radiografia', 'tecnico radiologia', 'tomografia', 'ressonancia'],
            'Redes de Computadores': ['rede', 'redes', 'network', 'infraestrutura', 'servidor', 'cabeamento', 'wifi', 'cisco', 'ti'],
            'Refrigeração e Climatização': ['ar condicionado', 'ar-condicionado', 'refrigeracao', 'climatizacao', 'geladeira', 'frigorifico', 'split', 'hvac'],
            'Saúde Bucal': ['dentista', 'dental', 'odontologia', 'odonto', 'dente', 'dentes', 'auxiliar dentista', 'asb'],
            'Secretaria Escolar': ['secretaria', 'escola', 'administracao escolar', 'recepcao escolar', 'matricula'],
            'Segurança do Trabalho': ['st', 'seguranca trabalho', 'epi', 'prevencao acidentes', 'sst', 'tecnico seguranca', 'nr'],
            'Serviços Jurídicos': ['direito', 'advogado', 'juridico', 'advocacia', 'justica', 'oab', 'leis', 'forum', 'paralegal'],
            'Sistemas de Energia Renovável': ['energia solar', 'painel solar', 'eolica', 'energia limpa', 'fotovoltaica', 'renovavel'],
            'Soldagem': ['soldador', 'solda', 'mig', 'tig', 'eletrodo', 'mag', 'metalurgia solda'],
            'Telecomunicações': ['telecom', 'telefonia', 'antenas', 'fibra optica', 'provedor', '5g', 'satelite'],
            'Tradução e Interpretação de Libras': ['libras', 'surdo', 'surdos', 'lingua sinais', 'deficiente auditivo', 'interprete libras', 'inclusao'],
            'Transações Imobiliárias': ['corretor', 'corretora', 'imoveis', 'imobiliaria', 'creci', 'venda imovel', 'tti'],
            'Trânsito': ['transito', 'agente transito', 'fiscal transito', 'ctb', 'auto escola', 'multas'],
            'Veterinária': ['veterinario', 'vet', 'animais', 'pet', 'cachorro', 'gato', 'aux veterinario', 'clinica veterinaria'],
            'Vendas': ['vendedor', 'vendedora', 'comercial', 'atendimento', 'varejo', 'balconista', 'representante']
        };

        const normalize = s => s
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '');

        const normalizedAliases = {};
        for (const [name, aliases] of Object.entries(COURSE_ALIASES)) {
            normalizedAliases[normalize(name)] = aliases.map(normalize).join(' ');
        }

        const courseData = Array.from(courseCards).map(card => {
            const tagName = card.querySelector('.course-card__tag strong');
            const title = card.querySelector('.course-card__title');
            const nameText = tagName ? tagName.textContent : '';
            const titleText = title ? title.textContent : '';
            const normalizedName = normalize(nameText);
            const aliasText = normalizedAliases[normalizedName] || '';
            const searchable = `${normalize(nameText)} ${normalize(titleText)} ${aliasText}`;
            return { card, normalized: searchable, visible: true };
        });

        const totalCount = courseData.length;
        const PAGE_SIZE = 6;
        const loadMoreBtn = document.querySelector('#load-more-btn');
        const loadMoreWrapper = document.querySelector('.load-more-wrapper');

        let rafId = null;
        let lastKey = null;
        let shownCount = Math.min(PAGE_SIZE, totalCount);

        const performFilter = () => {
            rafId = null;
            const raw = searchInput.value.slice(0, MAX_QUERY_LEN).trim();
            const term = normalize(raw);
            const hasSearch = term !== '';

            const key = `${term}|${shownCount}`;
            if (key === lastKey) return;
            lastKey = key;

            let matchCount = 0;
            courseData.forEach((item, index) => {
                const matchesSearch = !hasSearch || item.normalized.includes(term);
                if (matchesSearch) matchCount++;

                const withinPage = hasSearch || matchCount <= shownCount;
                const shouldShow = matchesSearch && withinPage;

                if (shouldShow !== item.visible) {
                    item.card.classList.toggle('is-hidden', !shouldShow);
                    item.visible = shouldShow;
                }
            });

            const visibleNow = hasSearch ? matchCount : Math.min(shownCount, matchCount);

            if (searchCount) {
                if (!hasSearch) {
                    searchCount.textContent =
                        shownCount >= totalCount
                            ? `${totalCount} cursos disponíveis`
                            : `Mostrando ${visibleNow} de ${totalCount} cursos`;
                } else if (matchCount === 0) {
                    searchCount.textContent = '';
                } else if (matchCount === 1) {
                    searchCount.textContent = '1 curso encontrado';
                } else {
                    searchCount.textContent = `${matchCount} cursos encontrados`;
                }
            }

            if (noResults) {
                noResults.hidden = !(matchCount === 0 && hasSearch);
            }

            if (courseGrid) {
                courseGrid.style.display = matchCount === 0 && hasSearch ? 'none' : '';
            }

            if (searchClear) {
                searchClear.hidden = !hasSearch;
            }

            if (loadMoreWrapper) {
                const hasMore = !hasSearch && shownCount < totalCount;
                loadMoreWrapper.hidden = !hasMore;
            }
        };

        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                shownCount = Math.min(shownCount + PAGE_SIZE, totalCount);
                performFilter();
            });
        }

        const scheduleFilter = () => {
            if (rafId !== null) return;
            rafId = requestAnimationFrame(performFilter);
        };

        searchInput.addEventListener('input', scheduleFilter);

        if (searchClear) {
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                searchInput.focus();
                performFilter();
            });
        }

        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                performFilter();
            }
        });

        performFilter();
    }

    /* ---------- Header shadow on scroll ---------- */
    if (header) {
        const onScroll = () => {
            header.style.boxShadow = window.scrollY > 4
                ? '0 4px 14px rgba(0,0,0,0.08)'
                : 'none';
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }
})();
